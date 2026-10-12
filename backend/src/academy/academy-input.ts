import {parseAcademyVideo} from './academy-video';
import { BadRequestException } from '@nestjs/common';
import { priceInput, minor, legacyMinor } from './academy-pricing';
import { createHash } from 'node:crypto';
import type { LearningCourse, Scholarship, Lesson } from './academy.schemas';
export function object(value: unknown, keys: string[]): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k)))
        throw new BadRequestException();
    return value as Record<string, unknown>;
}
export function text(value: unknown, max = 500): string {
    if (typeof value !== 'string' || !value.trim() || value.length > max)
        throw new BadRequestException();
    return value.trim();
}
export function integer(value: unknown, min = 0, max = 10000000): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
        throw new BadRequestException();
    return value;
}
export function flag(value: unknown): boolean {
    if (typeof value !== 'boolean')
        throw new BadRequestException();
    return value;
}
export function strings(value: unknown, max = 100): string[] {
    if (!Array.isArray(value) || value.length > max)
        throw new BadRequestException();
    return value.map(v => text(v));
}
export function slug(value: unknown): string {
    const s = text(value, 160);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))
        throw new BadRequestException();
    return s;
}
export function fileKey(value: unknown): string {
    const s = text(value, 300);
    if (!/^[a-zA-Z0-9_-]+\.(mp4|webm|pdf|txt|zip)$/.test(s))
        throw new BadRequestException();
    return s;
}
export function codeHash(value: unknown): string {
    const s = text(value, 64).toUpperCase();
    if (!/^[A-Z0-9-]{8,64}$/.test(s))
        throw new BadRequestException();
    return createHash('sha256').update(s).digest('hex');
}
function list(value: unknown, max: number) {
    if (!Array.isArray(value) || value.length > max)
        throw new BadRequestException();
    return value;
}
function unique(items: string[]) {
    if (new Set(items).size !== items.length)
        throw new BadRequestException();
}
export function learningInput(raw: unknown, courseSlug: string): LearningCourse {
    const o = object(raw, ['enabled', 'purchaseEnabled', 'priceBDT', 'salePriceBDT', 'currency', 'regularPriceMinor', 'salePriceMinor', 'saleStartsAt', 'saleEndsAt', 'accessTerms', 'benefits', 'category', 'description', 'outcomes', 'audience', 'tools', 'gallery', 'instructor', 'thumbnail', 'previewVideoUrl', 'modules', 'revision']);
    const modules = list(o.modules, 100).map(rawModule => {
        const m = object(rawModule, ['id', 'title', 'lessons']);
        return {
            id: slug(m.id), title: text(m.title, 200), lessons: list(m.lessons, 100).map(rawLesson => {
                const l = object(rawLesson, ['id', 'title', 'description', 'type', 'access', 'durationSeconds', 'text', 'file', 'videoInput', 'embedUrl', 'resources']);
                if (!['text', 'video'].includes(String(l.type)) || !['public', 'enrolled'].includes(String(l.access)))
                    throw new BadRequestException();
                const resources = list(l.resources ?? [], 20).map(value => {
                    const r = object(value, ['id', 'title', 'file']);
                    return {
                        id: slug(r.id), title: text(r.title, 200), file: fileKey(r.file)
                    };
                });
                unique(resources.map(r => r.id));
                const lesson: Lesson = {
                    id: slug(l.id), title: text(l.title, 200), description: l.description === undefined ? text(l.title, 200) : text(l.description, 5000), type: l.type as Lesson['type'], access: l.access as Lesson['access'], resources, ...(l.durationSeconds !== undefined ? {
                        durationSeconds: integer(l.durationSeconds, 1, 86400)
                    } : {}), ...(l.text !== undefined ? {
                        text: text(l.text, 50000)
                    } : {}), ...(l.file !== undefined ? {
                        file: fileKey(l.file)
                    } : {}), ...((l.videoInput??l.embedUrl)!==undefined?{embedUrl:parseAcademyVideo(l.videoInput??l.embedUrl)}:{})
                };
                if (lesson.type === 'text' && (!lesson.text || lesson.file || lesson.embedUrl) || lesson.file&&lesson.embedUrl || lesson.type === 'video' && lesson.text)
                    throw new BadRequestException();
                if (lesson.type === 'video' && lesson.file && !/\.(mp4|webm)$/.test(lesson.file))
                    throw new BadRequestException();
                return lesson;
            })
        };
    });
    unique(modules.map(m => m.id));
    unique(modules.flatMap(m => m.lessons.map(l => l.id)));
    for (const [index, lesson] of modules.flatMap(module => module.lessons).entries()) {
        if (lesson.access === 'public' && index !== 0)
            throw new BadRequestException('Only the first introductory lesson may be public; all remaining lessons require enrollment.');
    }
    const pricing = priceInput(o);
    let thumbnail: LearningCourse['thumbnail'];
    if (o.thumbnail !== undefined) {
        const image = object(o.thumbnail, ['src', 'alt']);
        const src = text(image.src, 200);
        // Existing, verified Academy assets only; never accept arbitrary remote or private media URLs.
        if (!['/banner/iot_banner.jpg', '/banner/esp32Bannetr.jpg', '/banner/aibanner3.jpg', '/banner/academy_2.jpg', '/banner/b2.jpg'].includes(src) && !/^media:[a-f0-9]{24}$/.test(src))
            throw new BadRequestException();
        thumbnail = { src, alt: text(image.alt, 300) };
    }
    let previewVideoUrl: string | undefined;
    if (o.previewVideoUrl !== undefined) {
        previewVideoUrl = text(o.previewVideoUrl, 2048);
        let u: URL;
        try {
            u = new URL(previewVideoUrl);
        }
        catch {
            throw new BadRequestException();
        }
        if (u!.protocol !== 'https:' || u!.hostname !== 'www.youtube.com' || u!.search || u!.hash || !/^\/embed\/[a-zA-Z0-9_-]{11}$/.test(u!.pathname) || u!.username || u!.password)
            throw new BadRequestException();
    }
    if (previewVideoUrl && (modules[0]?.lessons[0]?.type !== 'video' || modules[0]?.lessons[0]?.access !== 'public'))
        throw new BadRequestException('Preview media belongs to the first introductory video lesson.');
    let instructor: LearningCourse['instructor'];
    if (o.instructor !== undefined) {
        const i = object(o.instructor, ['name', 'biography']);
        instructor = {
            name: text(i.name, 160), biography: text(i.biography, 5000)
        };
    }
    return {
        slug: slug(courseSlug), enabled: flag(o.enabled), ...(o.purchaseEnabled!==undefined?{purchaseEnabled:flag(o.purchaseEnabled)}:{}), ...pricing, accessTerms: text(o.accessTerms, 2000), benefits: strings(o.benefits, 30), ...(o.tools!==undefined?{tools:strings(o.tools,50)}:{}), ...(o.gallery!==undefined?{gallery:list(o.gallery,20).map(value=>{const image=object(value,['src','alt']);const src=text(image.src,200);if(!['/banner/iot_banner.jpg','/banner/esp32Bannetr.jpg','/banner/aibanner3.jpg','/banner/academy_2.jpg','/banner/b2.jpg'].includes(src)&&!/^media:[a-f0-9]{24}$/.test(src))throw new BadRequestException();return {src,alt:text(image.alt,300)};})}:{}), outcomes: strings(o.outcomes, 50), modules, revision: integer(o.revision, 0), thumbnail, previewVideoUrl, instructor, ...Object.fromEntries(['category', 'description', 'audience'].filter(k => o[k] !== undefined).map(k => [k, text(o[k], k === 'description' ? 20000 : 2000)]))
    };
}
export function scholarshipInput(raw: unknown): Omit<Scholarship, 'redeemed'> {
    const o = object(raw, ['code', 'label', 'courses', 'anyCourse', 'kind', 'amount', 'amountMinor', 'startsAt', 'expiresAt', 'totalLimit', 'perAccountLimit', 'minimumSpendMinor', 'recipientEmail', 'active', 'revision']);
    if (!['percentage', 'fixed', 'full'].includes(String(o.kind)))
        throw new BadRequestException();
    const kind = o.kind as Scholarship['kind'];
    if (o.amountMinor !== undefined && (kind !== 'fixed' || o.amount !== undefined)) throw new BadRequestException();
    const amountMinor = kind === 'fixed' ? o.amountMinor === undefined ? legacyMinor(o.amount) : minor(o.amountMinor) : undefined;
    if (kind === 'fixed' && !amountMinor) throw new BadRequestException();
    const amount = kind === 'fixed' ? undefined : integer(o.amount, kind === 'full' ? 0 : 1, kind === 'percentage' ? 100 : 0);
    if (kind === 'full' && amount !== 0)
        throw new BadRequestException();
    const anyCourse=o.anyCourse===undefined?false:flag(o.anyCourse);
    const courses = strings(o.courses??[], 100).map(slug);
    if (anyCourse&&courses.length || !anyCourse&&!courses.length)
        throw new BadRequestException();
    unique(courses);
    const date = (value: unknown) => {
        const d = new Date(text(value, 40));
        if (!Number.isFinite(+d))
            throw new BadRequestException();
        return d;
    };
    const startsAt = date(o.startsAt), expiresAt = o.expiresAt===undefined||o.expiresAt===null?undefined:date(o.expiresAt);
    if (expiresAt && expiresAt <= startsAt)
        throw new BadRequestException();
    const recipientEmail = o.recipientEmail === undefined ? undefined : text(o.recipientEmail, 254).toLowerCase();
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))
        throw new BadRequestException();
    return {
        codeHash: codeHash(o.code), label: text(o.label, 160), courses, anyCourse, kind, amount, amountMinor, startsAt, expiresAt, totalLimit: integer(o.totalLimit, 1), perAccountLimit: integer(o.perAccountLimit, 1), minimumSpendMinor: o.minimumSpendMinor===undefined?0:minor(o.minimumSpendMinor), recipientEmail, active: flag(o.active), revision: integer(o.revision, 0)
    };
}
