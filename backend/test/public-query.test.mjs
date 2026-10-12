import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parsePublicQuery } = require('../dist/content/public-query.js');
const { ContentExceptionFilter } = require('../dist/content/content-exception.filter.js');

test('structured/repeated query input and editorial overrides are rejected', () => {
  for (const raw of [{ page: { $gt: 0 } }, { category: { $ne: null } }, { limit: ['1', '2'] }, { status: 'draft' }, { sort: ['title'] }]) {
    assert.throws(() => parsePublicQuery('projects', raw), error => error.getStatus() === 400);
  }
  const query = parsePublicQuery('projects', { category: '{"$ne":null}' });
  assert.deepEqual(query.filter.category, { $eq: '{"$ne":null}' });
  assert.equal(query.filter.status, 'published');
});

test('unexpected driver errors are not disclosed by the public exception filter', () => {
  let status;
  let body;
  const response = { status: code => { status = code; return response; }, json: value => { body = value; } };
  new ContentExceptionFilter().catch(new Error('SYNTHETIC_CREDENTIAL_AND_DATABASE_DETAIL'), { switchToHttp: () => ({ getResponse: () => response }) });
  assert.equal(status, 500);
  assert.deepEqual(body, { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});
