import assert from 'node:assert/strict';
import {blockedGoogleSearch} from '../browser/public/search-fallback.mjs';
const blocked='Our systems have detected unusual traffic from your computer network. Please try your request again later. IP address: fixture';
const source='https://www.google.com/search?q=music+%26+cats&safe=active';
const target=new URL(blockedGoogleSearch(source,blocked));assert.equal(target.hostname,'duckduckgo.com');assert.equal(target.searchParams.get('q'),'music & cats');assert.equal(target.searchParams.get('kp'),'1');
const sorry='https://www.google.com/sorry/index?continue='+encodeURIComponent(source);assert.equal(blockedGoogleSearch(sorry,'About this page\n\n'+blocked),target.href);
assert.equal(new URL(blockedGoogleSearch('https://google.com/search?q=hi&safe=off',blocked)).searchParams.get('kp'),'-1');
for(const [url,text] of [[source,'Search results\n'+blocked],['https://duckduckgo.com/?q=hi',blocked],['https://google.com.evil.example/search?q=hi',blocked],['https://google.com/search',blocked],['https://google.com/about',blocked],['https://google.com/sorry?continue=https://example.com/search?q=hi',blocked],['invalid',blocked]])assert.equal(blockedGoogleSearch(url,text),null);
console.log('Search fallback passed: Google traffic-block detection, query preservation, Safe Search, sorry redirects, no false match on regular results, and no redirect loops.');
