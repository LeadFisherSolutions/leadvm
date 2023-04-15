'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const leadvm = require('..');

const SCRIPT_FIELDS = ['__dirname', '__filename', 'type', 'access', 'script', 'context', 'exports'];
const target = name => path.join(__dirname, 'examples', name);

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

test('Error.empty.js', async t => {
  try {
    await leadvm.readScript(target('error.empty.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});

test('[JS/CJS] Folder loader', async t => {
  const scripts = await leadvm.readDir(target('readDir'));
  const { arrow, simple } = scripts;

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

test('Access for node internal module', async t => {
  const sandbox = {};
  sandbox.global = sandbox;
  const src = `module.exports = { fs: require('fs') };`;
  const context = leadvm.createContext(Object.freeze(sandbox));
  const ms = leadvm.createScript(src, { context, access: { fs: true }, type: 'cjs' });
});

test('Create Default Context', async t => {
  const context = leadvm.createContext();
  assert.deepEqual(Object.keys(context), []);
  assert.strictEqual(context.global, undefined);
});

test('Create Common Context', async t => {
  const context = leadvm.createContext(leadvm.COMMON_CONTEXT);
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

test('[JS/CJS] Error.reference.js Error.reference.cjs (line number)', async t => {
  try {
    const script = await leadvm.readScript(target('error.reference.js'));
    await script.exports();

    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    const [, firstLine] = err.stack.split('\n');
    const [, lineNumber] = firstLine.split(':');
    assert.strictEqual(parseInt(lineNumber, 10), 2);
  }

  try {
    const script = await leadvm.readScript(target('error.reference.cjs'));
    await script.exports();
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    const [, firstLine] = err.stack.split('\n');
    const [, lineNumber] = firstLine.split(':');
    assert.strictEqual(parseInt(lineNumber, 10), 4);
  }
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

test('[JS/CJS] Access non-existent npm module', async test => {
  try {
    const ms = leadvm.createScript(`const notExist = require('leadfisher');`, {
      access: { leadfisher: true },
      type: 'cjs',
    });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Cannot find module 'leadfisher'`);
  }

  try {
    const ms = leadvm.createScript(`const notExist = require('leadfisher');`, { access: { leadfisher: true } });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Cannot find module 'leadfisher'`);
  }
});
