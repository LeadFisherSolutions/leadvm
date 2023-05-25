'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { exec, readDir, COMMON_CTX, createCtx, readScript, read } = require('../..');

const target = name => path.join(__dirname, name);

test('Script executor', async () => {
  const ms = exec(`({field: 'value'});`);
  assert.deepStrictEqual(Object.keys(ms), ['field']);
  assert.strictEqual(ms.field, 'value');
});

test('[JS/CJS] Script loader', async t => {
  const simple = await readScript(target('examples/simple.js'));

  assert.deepStrictEqual(Object.keys(simple), ['field', 'add', 'sub']);
  assert.strictEqual(simple.field, 'value');
  assert.strictEqual(simple.add(2, 3), 5);
  assert.strictEqual(simple.sub(2, 3), -1);
});

test('[JS/CJS] Universal loader', async t => {
  const scripts = await read(target('examples'));
  const { deep, simple } = scripts;
  const { arrow } = deep;

  assert.strictEqual(typeof scripts, 'object');
  assert.strictEqual(Object.keys(scripts).length, 2);

  assert.deepStrictEqual(Object.keys(simple), ['field', 'add', 'sub']);
  assert.strictEqual(simple.field, 'value');
  assert.strictEqual(simple.add(2, 3), 5);
  assert.strictEqual(simple.sub(2, 3), -1);

  assert.strictEqual(typeof arrow, 'function');
  assert.strictEqual(arrow.toString(), '(a, b) => a + b');
  assert.strictEqual(arrow(2, 3), 5);
  assert.strictEqual(arrow(-1, 1), 0);
});

test('[JS/CJS] Folder loader', async t => {
  const scripts = await readDir(target('examples'));
  const { deep, simple } = scripts;
  const { arrow } = deep;

  assert.strictEqual(typeof scripts, 'object');
  assert.strictEqual(Object.keys(scripts).length, 2);

  assert.deepStrictEqual(Object.keys(simple), ['field', 'add', 'sub']);
  assert.strictEqual(simple.field, 'value');
  assert.strictEqual(simple.add(2, 3), 5);
  assert.strictEqual(simple.sub(2, 3), -1);

  assert.strictEqual(typeof arrow, 'function');
  assert.strictEqual(arrow.toString(), '(a, b) => a + b');
  assert.strictEqual(arrow(2, 3), 5);
  assert.strictEqual(arrow(-1, 1), 0);
});

test('Create Default Context', async t => {
  const context = createCtx();
  assert.deepEqual(Object.keys(context), []);
  assert.strictEqual(context.global, undefined);
});

test('Create Common Context', async t => {
  const context = createCtx(COMMON_CTX);
  assert.strictEqual(typeof context, 'object');
  assert.strictEqual(context.console, console);
  assert.strictEqual(context.global, undefined);
});

test('Create Custom Context', async t => {
  const sandbox = { field: 'value' };
  sandbox.global = sandbox;
  const context = createCtx(Object.freeze(sandbox));
  assert.strictEqual(context.field, 'value');
  assert.deepEqual(Object.keys(context), ['field', 'global']);
  assert.strictEqual(context.global, sandbox);
});

test('[JS/CJS] Access internal not permitted', async test => {
  try {
    const ms = exec(`const fs = require('fs');`, { type: 'cjs' });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'fs'`);
  }

  try {
    const ms = exec(`const fs = require('fs');`);
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'fs'`);
  }
});

test('[JS/CJS] Access non-existent not permitted', async test => {
  try {
    const src = `const notExist = require('nothing');`;
    const ms = exec(src, { type: 'cjs' });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'nothing'`);
  }

  try {
    const src = `const notExist = require('nothing');`;
    const ms = exec(src);
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'nothing'`);
  }
});
