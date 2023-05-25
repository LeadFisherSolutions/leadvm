'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { readScript, createCtx } = require('../..');

const target = name => path.join(__dirname, 'examples', name);

test('[JS] Simple.js', async t => {
  const ms = await readScript(target('simple.js'));

  assert.deepStrictEqual(Object.keys(ms), ['field', 'add', 'sub']);
  assert.strictEqual(ms.field, 'value');
  assert.strictEqual(ms.add(2, 3), 5);
  assert.strictEqual(ms.sub(2, 3), -1);
});

test('[JS] Simple (from non extension file)', async t => {
  const ms = await readScript(target('simple'));

  assert.deepStrictEqual(Object.keys(ms), ['field', 'add', 'sub']);
  assert.strictEqual(ms.field, 'value');
  assert.strictEqual(ms.add(2, 3), 5);
  assert.strictEqual(ms.sub(2, 3), -1);
});

test('[JS] Complex.js', async t => {
  const ctx = createCtx({ setTimeout });
  const options = { filename: 'CUSTOM FILE NAME', ctx };
  const ms = await readScript(target('complex.js'), options);

  await ms.add(2, 3, (err, sum) => {
    assert.strictEqual(err.constructor.name === 'Error', true);
    assert.strictEqual(sum, 5);
    assert.strictEqual(err.stack.includes('complex.js'), true);
    assert.strictEqual(err.message, 'Custom error');
  });
});

test('[JS] Function.js', async t => {
  const ms = await readScript(target('function.js'));

  assert.strictEqual(typeof ms, 'function');
  assert.strictEqual(ms(2, 3), 6);
  assert.strictEqual(ms.bind(null, 3)(4), 12);
});

test('[JS] Arrow.js', async t => {
  const ms = await readScript(target('arrow.js'));

  assert.strictEqual(typeof ms, 'function');
  assert.strictEqual(ms.toString(), '(a, b) => a + b');
  assert.strictEqual(ms(2, 3), 5);
  assert.strictEqual(ms(-1, 1), 0);
});

test('[JS] Async.js', async t => {
  const ms = await readScript(target('async.js'));
  const result = await ms('str', { field: 'value' });

  assert.strictEqual(typeof ms, 'function');
  assert.strictEqual(ms.constructor.name, 'AsyncFunction');
  assert.deepEqual(result, { name: 'str', data: { field: 'value' } });
  assert.rejects(ms('', { field: 'value' }));
});

test('[JS] Local.js', async t => {
  const ms = await readScript(target('local.js'));
  const result = await ms('str');

  assert.deepEqual(result, { args: ['str'], local: 'hello' });
});
