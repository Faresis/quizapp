import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coachTokenExpiry} from '../lib/coach-token-expiry.mjs';
const date=s=>Date.parse(s);
test('one-year, multi-year and default expiration use calendar months',()=>{const start=date('2026-11-01T18:00:00Z');assert.equal(coachTokenExpiry(start,{months:12}),date('2027-11-01T18:00:00Z'));assert.equal(coachTokenExpiry(start,{months:24}),date('2028-11-01T18:00:00Z'));assert.equal(coachTokenExpiry(start,{months:120}),date('2036-11-01T18:00:00Z'));assert.equal(coachTokenExpiry(start),coachTokenExpiry(start,{months:12}));});
test('month-end and leap-day expiry clamp without overflowing into another month',()=>{assert.equal(coachTokenExpiry(date('2026-01-31T23:59:59.123Z'),{months:1}),date('2026-02-28T23:59:59.123Z'));assert.equal(coachTokenExpiry(date('2028-01-31T12:00:00Z'),{months:1}),date('2028-02-29T12:00:00Z'));assert.equal(coachTokenExpiry(date('2028-02-29T12:00:00Z'),{months:12}),date('2029-02-28T12:00:00Z'));});
test('invalid or unrepresentable month durations are rejected',()=>{for(const months of [0,-1,1.5,'12',null,true,Infinity,Number.MAX_SAFE_INTEGER])assert.throws(()=>coachTokenExpiry(Date.now(),{months}));assert.throws(()=>coachTokenExpiry(Date.now(),{months:12,hours:24}));});
test('legacy hour-based integrations retain their explicit short-term expiry',()=>{const start=Date.now();assert.equal(coachTokenExpiry(start,{hours:24}),start+86400000);assert.throws(()=>coachTokenExpiry(start,{hours:169}));});
