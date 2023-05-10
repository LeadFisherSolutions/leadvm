'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const leadvm = require('../..');

const SCRIPT_FIELDS = ['__dirname', '__filename', 'type', 'access', 'script', 'context', 'exports'];
const target = name => path.join(__dirname, name);

test('[JS] Simple.js', async t => {
  const ms = await leadvm.readScript(target('simple.js'));

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field', 'add', 'sub']);
  assert.strictEqual(ms.exports.field, 'value');
  assert.strictEqual(ms.exports.add(2, 3), 5);
  assert.strictEqual(ms.exports.sub(2, 3), -1);
});

test('[JS] Simple (from non extension file)', async t => {
  const ms = await leadvm.readScript(target('simple'));

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field', 'add', 'sub']);
  assert.strictEqual(ms.exports.field, 'value');
  assert.strictEqual(ms.exports.add(2, 3), 5);
  assert.strictEqual(ms.exports.sub(2, 3), -1);
});

test('[JS] Complex.js', async t => {
  const context = leadvm.createContext({ setTimeout });
  const options = { __filename: 'CUSTOM FILE NAME', context };
  const ms = await leadvm.readScript(target('complex.js'), options);

  assert.strictEqual(ms.constructor.name, 'Script');
  ms.exports.add(2, 3, (err, sum) => {
    assert.strictEqual(err.constructor.name === 'Error', true);
    assert.strictEqual(sum, 5);
    assert.strictEqual(err.stack.includes('CUSTOM FILE NAME'), true);
    assert.strictEqual(err.message, 'Custom error');
  });
});

test('[JS] Function.js', async t => {
  const ms = await leadvm.readScript(target('function.js'));

  assert.strictEqual(typeof ms.exports, 'function');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.strictEqual(ms.exports(2, 3), 6);
  assert.strictEqual(ms.exports.bind(null, 3)(4), 12);
});

test('[JS] Arrow.js', async t => {
  const ms = await leadvm.readScript(target('arrow.js'));

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.toString(), '(a, b) => a + b');
  assert.strictEqual(ms.exports(2, 3), 5);
  assert.strictEqual(ms.exports(-1, 1), 0);
});

test('[JS] Async.js', async t => {
  const ms = await leadvm.readScript(target('async.js'));
  const result = await ms.exports('str', { field: 'value' });

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.constructor.name, 'AsyncFunction');
  assert.deepEqual(result, { name: 'str', data: { field: 'value' } });
  assert.rejects(ms.exports('', { field: 'value' }));
});

test('[JS] Local.js', async t => {
  const ms = await leadvm.readScript(target('local.js'));
  const result = await ms.exports('str');

  assert.deepEqual(result, { args: ['str'], local: 'hello' });
});