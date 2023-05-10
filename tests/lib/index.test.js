'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const leadvm = require('../..');

const SCRIPT_FIELDS = ['__dirname', '__filename', 'type', 'access', 'script', 'context', 'exports'];
const target = name => path.join(__dirname, name);

test('Script constructor', async t => {
  const ms = new leadvm.Script(`({field: 'value'});`);
  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field']);
  assert.strictEqual(ms.exports.field, 'value');
});

test('Script factory', async t => {
  const ms = leadvm.createScript(`({field: 'value'});`);

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field']);
  assert.strictEqual(ms.exports.field, 'value');
});

test('[JS/CJS] Folder loader', async t => {
  const scripts = await leadvm.readDir(target('example'));
  const { deep, simple } = scripts;
  const { arrow } = deep;

  assert.strictEqual(typeof scripts, 'object');
  assert.strictEqual(Object.keys(scripts).length, 2);

  assert.deepStrictEqual(Object.keys(simple.exports), ['field', 'add', 'sub']);
  assert.strictEqual(simple.exports.field, 'value');
  assert.strictEqual(simple.exports.add(2, 3), 5);
  assert.strictEqual(simple.exports.sub(2, 3), -1);

  assert.strictEqual(typeof arrow.exports, 'function');
  assert.strictEqual(arrow.exports.toString(), '(a, b) => a + b');
  assert.strictEqual(arrow.exports(2, 3), 5);
  assert.strictEqual(arrow.exports(-1, 1), 0);
});

test('Create Default Context', async t => {
  const context = leadvm.createContext();
  assert.deepEqual(Object.keys(context), []);
  assert.strictEqual(context.global, undefined);
});

test('Create Common Context', async t => {
  const context = leadvm.createContext(leadvm.COMMON_CTX);
  assert.strictEqual(typeof context, 'object');
  assert.strictEqual(context.console, console);
  assert.strictEqual(context.global, undefined);
});

test('Create Custom Context', async t => {
  const sandbox = { field: 'value' };
  sandbox.global = sandbox;
  const context = leadvm.createContext(Object.freeze(sandbox));
  assert.strictEqual(context.field, 'value');
  assert.deepEqual(Object.keys(context), ['field', 'global']);
  assert.strictEqual(context.global, sandbox);
});

test('[JS/CJS] Access internal not permitted', async test => {
  try {
    const ms = leadvm.createScript(`const fs = require('fs');`, { type: 'cjs' });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'fs'`);
  }

  try {
    const ms = leadvm.createScript(`const fs = require('fs');`);
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'fs'`);
  }
});

test('[JS/CJS] Access non-existent not permitted', async test => {
  try {
    const src = `const notExist = require('nothing');`;
    const ms = leadvm.createScript(src, { type: 'cjs' });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'nothing'`);
  }

  try {
    const src = `const notExist = require('nothing');`;
    const ms = leadvm.createScript(src);
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'nothing'`);
  }
});
