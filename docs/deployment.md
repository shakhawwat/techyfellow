# Docker and Nginx foundation

This is a local HTTP foundation, unsuitable for public deployment until TLS is configured. EBN compatibility is not verified. No deployment has been performed. Step 4 adds MongoDB only to the development override; production requires an external MONGODB_URI.

## Prerequisites

Install Docker Engine and the Docker Compose plugin; verify `docker version` and `docker compose version`. The commands below run from `techyfellow/`. Node and Nginx base images use exact version tags. App runtime containers run as the image's non-root `node` user. Only Nginx publishes a host port, bound to loopback.

## Development

```sh
docker compose -p techyfellow-dev -f docker-compose.yml -f docker-compose.dev.yml config --quiet
docker compose -p techyfellow-dev -f docker-compose.yml -f docker-compose.dev.yml up --build --wait --wait-timeout 180
```

Open http://localhost:8080. API health is http://localhost:8080/api/v1/health/live. Source/config mounts are read-only; Next.js and NestJS watch source changes with polling. Dependencies and build outputs remain in each container's writable filesystem, isolated from host node_modules. Rebuild with `up --build` after package/lockfile changes; no dependency volumes need refreshing. Next.js writes generated files inside the container. Stop this project only:

```sh
docker compose -p techyfellow-dev -f docker-compose.yml -f docker-compose.dev.yml down
```

## Local production mode

```sh
# Supply external MONGODB_URI and exact HTTPS AUTH_ALLOWED_ORIGINS securely via environment or an untracked root .env.
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml build frontend backend
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml up -d --wait --wait-timeout 180
curl --fail http://localhost:8080/
curl --fail http://localhost:8080/api/v1/health/live
docker compose -p techyfellow-prod -f docker-compose.yml -f docker-compose.prod.yml down
```

Expected health JSON: `{"status":"ok"}`. Nginx preserves `/api/` when proxying to backend:4000; other paths go to frontend:3000, with WebSocket upgrade support for development. Health checks monitor each app and Nginx separately. Nginx starts after both apps are healthy. Restart policies recover exited production processes; an unhealthy status alone does not restart a running process.

Do not combine dev and prod overrides. Use the same explicit project name and file pair throughout each session. Dev and prod use port 8080, so run only one at a time. `down` removes only the selected project's containers and network; omit `--volumes`, do not prune, and leave unrelated projects alone. The development database now uses a persistent named volume; retain it when stopping services.

## Environment handling

Compose explicitly supplies NODE_ENV, application ports, hostname and watcher settings. The backend uses PORT=4000 in containers, matching the Nginx upstream and health check. Its independent host process still permits PORT overrides. Frontend uses 3000 and binds 0.0.0.0. Step 4 requires an external MONGODB_URI for production; development supplies its private Compose URI. Step 7 also requires exact HTTPS AUTH_ALLOWED_ORIGINS in production; see [authentication configuration](authentication.md) for cookie/CSRF/session/proxy settings.

Docker builds exclude real .env files, node_modules, build outputs, logs and common credential files. Templates are documentation; do not put credentials in them. Compose's root .env is for interpolation and is not automatically passed to application containers. Add documented runtime `environment`/`env_file` settings only when features need them; keep real files untracked and outside build contexts.

Next.js `NEXT_PUBLIC_*` values are compiled into browser assets during `npm run build`; changing runtime container variables will not change those assets. Step 9 supplies the non-secret `NEXT_PUBLIC_API_BASE_URL` build argument, defaulting to `/api/v1` for same-origin Nginx routing. Set it before building and rebuild the frontend when changing it. Absolute API URLs require HTTPS in production and matching backend origin/cookie configuration; same-origin routing is preferred. Never pass secrets as public variables or Docker build args. Runtime server-only values should be injected separately.

Frontend builds use standalone output and copy both public and .next/static assets into the runtime image. Host `npm start` still uses Next.js normally; container startup runs the standalone server.js. Backend installs only production dependencies in its final image. Both builds use generated npm lockfiles and npm ci.

## EBN verification before deployment

Confirm EBN supplies a server with administrative SSH access, a supported Linux distribution/CPU architecture, Docker Engine and Compose support, permitted container networking, sufficient disk/RAM for builds, and outbound access to image/npm registries. Verify these on the actual EBN server; local Docker success is not evidence of EBN support. Check firewall rules, port availability, updates, log rotation, operational ownership and restart behavior before deployment. Obtain server/domain details and explicit deployment instruction first.

## Public DNS and HTTPS requirements

Configure the intended domain's A/AAAA records to the server and verify resolution. Choose a TLS termination strategy: an HTTPS reverse proxy/load balancer in front of this loopback listener, or a reviewed Nginx HTTPS configuration with certificate mounts and published 443. Obtain trusted certificates, automate renewal, redirect HTTP to HTTPS, and verify secure forwarding headers. Open only needed HTTP/HTTPS ports and restrict SSH; keep 3000/4000 private. Review IPv6 and Docker firewall behavior. The current localhost:8080 HTTP mapping is for local checks, not a public deployment configuration.

## References

- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Docker Next.js guide](https://docs.docker.com/guides/nextjs/)
- [Compose services and health checks](https://docs.docker.com/reference/compose-file/services/)

## Step 3 verification results

Both merged Compose configurations validated; both production images built successfully with npm ci. All three production containers became healthy. Both application runtime users were verified as UID 1000. The homepage, exact health JSON, and six referenced static assets passed through Nginx.

The first local startup failed because an unrelated service already allocated 127.0.0.1:8080. It was left untouched. Runtime checks instead used a temporary third override with `ports: !override` and `127.0.0.1:0:80`, assigned port 32768 by Docker. The temporary override was removed after cleanup; checked-in defaults remain localhost:8080. Stop or reconfigure the existing port owner yourself before using the default commands. Both attempts' verification containers/network were removed without deleting volumes or touching unrelated services. Development container startup/source reload and EBN/HTTPS deployment were not tested in this step.

## Step 4 database configuration

See the [README MongoDB section](../README.md#mongodb-development-and-readiness) for replica-set setup, persistent storage, bounded readiness checks, transaction verification, host-run access and outage/recovery commands. Production Compose never starts the development MongoDB service. Liveness checks do not certify database availability; check `/api/v1/health/ready` separately.

## Step 10 image settings

Compose forwards optional R2 credentials/runtime limits only to the backend. `NEXT_PUBLIC_MEDIA_HOST` is a non-secret frontend build argument and must match the approved `MEDIA_PUBLIC_BASE_URL` hostname; rebuild after changes. Empty settings disable uploads/previews explicitly. See [media configuration and recovery](media.md). Nginx increases the body limit only for the exact upload handler; application limits remain authoritative. No R2 provisioning or deployment has been performed.

## Step 11 public server rendering

Compose supplies server-only runtime `CONTENT_API_BASE_URL`, default `http://backend:4000/api/v1`. Host-run Next.js defaults to `http://127.0.0.1:4000/api/v1`. The base must end in `/api/v1` and contain no credentials, query or fragment. It is not a public build argument; changing it requires restarting the frontend. Homepage public GET requests omit cookies and never call session/admin endpoints. Successful public lists are retained for at most 60 seconds per frontend process; unavailable responses are not cached or replaced with stale records. See [homepage behavior](homepage.md).

## Step 12 canonical origin

Optional server-only runtime `PUBLIC_SITE_URL` must be a verified HTTPS origin. Compose forwards it to the frontend; no domain is assumed when empty. Restart the frontend after changing it. This is separate from `NEXT_PUBLIC_*` build-time settings. See [public page caching and canonical behavior](public-pages.md).
