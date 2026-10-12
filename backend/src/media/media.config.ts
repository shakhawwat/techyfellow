// All storage settings stay server-side. Absent settings disable uploads; malformed settings fail startup safely.
export function mediaConfiguration(env: Record<string, unknown>) {
  const number = (name: string, fallback: number, maximum: number) => {
    const raw = String(env[name] ?? fallback), n = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n < 1 || n > maximum) throw new Error(`${name} is outside its allowed range`);
    return n;
  };
  const settings = Object.fromEntries(['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'MEDIA_PUBLIC_BASE_URL'].map(key => [key, typeof env[key] === 'string' ? env[key].trim() : '']));
  if (settings.R2_ENDPOINT && !/^https:\/\/[a-f0-9]{32}(?:\.(?:eu|fedramp))?\.r2\.cloudflarestorage\.com$/.test(settings.R2_ENDPOINT)) throw new Error('R2_ENDPOINT must be an approved Cloudflare R2 HTTPS endpoint');
  if (settings.R2_BUCKET && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(settings.R2_BUCKET)) throw new Error('R2_BUCKET must be a valid bucket name');
  if (settings.MEDIA_PUBLIC_BASE_URL) {
    try { const url = new URL(settings.MEDIA_PUBLIC_BASE_URL); if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || /[*]/.test(url.hostname)) throw new Error(); settings.MEDIA_PUBLIC_BASE_URL = url.origin; }
    catch { throw new Error('MEDIA_PUBLIC_BASE_URL must be one exact HTTPS origin'); }
  }
  return { ...settings, MEDIA_MAX_BYTES: number('MEDIA_MAX_BYTES', 5 * 1024 * 1024, 20 * 1024 * 1024),
    MEDIA_MAX_DIMENSION: number('MEDIA_MAX_DIMENSION', 8192, 16384), MEDIA_MAX_PIXELS: number('MEDIA_MAX_PIXELS', 40_000_000, 100_000_000) };
}
