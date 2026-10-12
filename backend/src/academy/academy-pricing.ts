import { BadRequestException } from '@nestjs/common';

export interface PriceFields {
    currency?: 'BDT';
    regularPriceMinor?: number;
    salePriceMinor?: number;
    saleStartsAt?: Date;
    saleEndsAt?: Date;
    // Read-only compatibility with approved prices saved before minor-unit storage.
    priceBDT?: number;
    salePriceBDT?: number;
}
export const MAX_PRICE_MINOR = 1000000000;
export function minor(value: unknown): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > MAX_PRICE_MINOR)
        throw new BadRequestException('Prices must be nonnegative integer BDT minor units.');
    return value;
}
export function legacyMinor(value: unknown): number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
        throw new BadRequestException();
    return minor(value * 100);
}
export function priceInput(o: Record<string, unknown>): PriceFields {
    if (o.currency !== undefined && o.currency !== 'BDT') throw new BadRequestException();
    const legacy = o.priceBDT !== undefined || o.salePriceBDT !== undefined;
    if (legacy && (o.regularPriceMinor !== undefined || o.salePriceMinor !== undefined)) throw new BadRequestException();
    const regularPriceMinor = o.regularPriceMinor === undefined ? o.priceBDT === undefined ? undefined : legacyMinor(o.priceBDT) : minor(o.regularPriceMinor);
    const salePriceMinor = o.salePriceMinor === undefined ? o.salePriceBDT === undefined ? undefined : legacyMinor(o.salePriceBDT) : minor(o.salePriceMinor);
    const date = (value: unknown) => {
        if (value === undefined) return undefined;
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new BadRequestException();
        const parsed = new Date(value);
        if (!Number.isFinite(+parsed)) throw new BadRequestException();
        return parsed;
    };
    const saleStartsAt = date(o.saleStartsAt), saleEndsAt = date(o.saleEndsAt);
    if (salePriceMinor !== undefined && (regularPriceMinor === undefined || salePriceMinor >= regularPriceMinor) ||
        (saleStartsAt || saleEndsAt) && salePriceMinor === undefined ||
        saleStartsAt && saleEndsAt && saleStartsAt >= saleEndsAt) throw new BadRequestException('Sale must be lower than the regular price and have valid dates.');
    return { currency: 'BDT', regularPriceMinor, salePriceMinor, saleStartsAt, saleEndsAt };
}
export function coursePricing(fields?: PriceFields | null, now = new Date()) {
    const regular = fields?.regularPriceMinor ?? (fields?.priceBDT === undefined ? undefined : fields.priceBDT * 100);
    const sale = fields?.salePriceMinor ?? (fields?.salePriceBDT === undefined ? undefined : fields.salePriceBDT * 100);
    if (regular === undefined || !Number.isSafeInteger(regular) || regular < 0 || regular > MAX_PRICE_MINOR)
        return { currency: 'BDT' as const, state: 'unconfigured' as const, saleActive: false, discountPercent: 0, paymentAvailable: false as const, stackingRule: 'best-single-discount' as const };
    const saleActive = sale !== undefined && Number.isSafeInteger(sale) && sale >= 0 && sale < regular &&
        (!fields?.saleStartsAt || +new Date(fields.saleStartsAt) <= +now) && (!fields?.saleEndsAt || +new Date(fields.saleEndsAt) > +now);
    const current = saleActive ? sale! : regular;
    return { currency: 'BDT' as const, state: regular === 0 ? 'free' as const : 'paid' as const, regularPriceMinor: regular,
        currentPriceMinor: current, saleActive, discountPercent: saleActive ? Math.round((regular - current) / regular * 100) : 0,
        subtotalMinor: regular, discountMinor: regular - current, finalMinor: current,
        saleStartsAt: fields?.saleStartsAt, saleEndsAt: fields?.saleEndsAt, paymentAvailable: false as const, stackingRule: 'best-single-discount' as const };
}
export function codeTotals(pricing: ReturnType<typeof coursePricing>, kind: 'full' | 'percentage' | 'fixed', amount: number) {
    if (pricing.state === 'unconfigured') throw new BadRequestException('Course price is not configured.');
    const regular = pricing.regularPriceMinor!;
    const codeDiscount = kind === 'full' ? regular : kind === 'percentage' ? Math.floor(regular * amount / 100) : Math.min(regular, amount);
    // A code replaces the sale only when it is a better discount; discounts never stack.
    const discountMinor = Math.min(regular, Math.max(pricing.discountMinor!, codeDiscount));
    return { currency: 'BDT' as const, subtotalMinor: regular, discountMinor, finalMinor: Math.max(0, regular - discountMinor),
        codeDiscountMinor: codeDiscount, appliedDiscount: codeDiscount >= pricing.discountMinor! ? 'code' : 'sale',
        stackingRule: 'best-single-discount' as const, paymentAvailable: false as const };
}
