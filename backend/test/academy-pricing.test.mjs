import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {coursePricing,priceInput,codeTotals}=require('../dist/academy/academy-pricing.js');
test('explicit free, paid and unconfigured states; preserve approved legacy prices',()=>{
 assert.equal(coursePricing().state,'unconfigured');assert.equal(coursePricing({}).state,'unconfigured');
 assert.equal(coursePricing({regularPriceMinor:0}).state,'free');assert.equal(coursePricing({regularPriceMinor:12599}).currentPriceMinor,12599);
 assert.equal(coursePricing({priceBDT:2500,salePriceBDT:1490}).currentPriceMinor,149000);
 assert.equal(priceInput({priceBDT:2500}).regularPriceMinor,250000);assert.equal('priceBDT' in priceInput({priceBDT:2500}),false);
 for(const value of [-1,1.1,NaN,Infinity,'0'])assert.throws(()=>priceInput({regularPriceMinor:value}));
 assert.throws(()=>priceInput({currency:'USD',regularPriceMinor:100}));
 assert.throws(()=>priceInput({priceBDT:1,regularPriceMinor:100}));
});
test('sale start inclusive, expiry exclusive, invalid sale rejected',()=>{
 const now=new Date('2026-10-12T00:00:00Z'),base={regularPriceMinor:500000,salePriceMinor:299000};
 assert.equal(coursePricing({...base,saleStartsAt:new Date(+now+1)},now).saleActive,false);
 assert.equal(coursePricing({...base,saleStartsAt:now,saleEndsAt:new Date(+now+1)},now).saleActive,true);
 assert.equal(coursePricing({...base,saleEndsAt:now},now).saleActive,false);
 assert.equal(coursePricing({...base,saleEndsAt:new Date(+now-1)},now).currentPriceMinor,500000);
 for(const value of [{regularPriceMinor:100,salePriceMinor:100},{regularPriceMinor:100,salePriceMinor:101},{salePriceMinor:1},{regularPriceMinor:100,saleStartsAt:now.toISOString()},{...base,saleStartsAt:now.toISOString(),saleEndsAt:now.toISOString()}])assert.throws(()=>priceInput(value));
});
test('best single discount, fractional arithmetic and zero floor',()=>{
 const pricing=coursePricing({regularPriceMinor:50000,salePriceMinor:40000});
 assert.equal(codeTotals(pricing,'percentage',25).finalMinor,37500);
 assert.equal(codeTotals(pricing,'percentage',10).finalMinor,40000);
 assert.equal(codeTotals(pricing,'fixed',15000).finalMinor,35000);
 assert.equal(codeTotals(pricing,'fixed',100000).finalMinor,0);
 assert.equal(codeTotals(pricing,'full',0).finalMinor,0);
 assert.equal(codeTotals(coursePricing({regularPriceMinor:101}),'percentage',33).discountMinor,33);
 assert.throws(()=>codeTotals(coursePricing(),'full',0));
});
