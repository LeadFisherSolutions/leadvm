'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { execute, readScript } = require('../..');

const target = name => path.join(__dirname, 'examples', name);

test('[CJS] Eval error ', async test => {
  try {
    execute(`module.exports = eval('100 * 2');`, { type: 'cjs' });
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});

test('[JS] Eval error', async test => {
  try {
    execute(`eval('100 * 2')`);
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});

test('[JS] Error.notfound.js', async t => {
  let ms;
  try {
    ms = await readScript(target('error.notfound.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.code, 'ENOENT');
  }
  assert.strictEqual(ms, undefined);
});

test('[JS] Error.syntax.js', async t => {
  try {
    await readScript(target('error.syntax.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});

test('[JS] Error.reference.js', async t => {
  try {
    const script = await readScript(target('error.reference.js'));
    await script();

    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'ReferenceError');
  }
});

test('[JS] Call undefined as a function', async t => {
  try {
    const script = await readScript(target('error.undef.js'));
    await script();
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'TypeError');
  }
});

test('[JS/CJS] Error.reference.js Error.reference.cjs (line number)', async t => {
  try {
    const script = await readScript(target('error.reference.js'));
    await script();

    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    const [, firstLine] = err.stack.split('\n');
    const [, lineNumber] = firstLine.split(':');
    assert.strictEqual(parseInt(lineNumber, 10), 2);
  }

  try {
    const script = await readScript(target('error.reference.cjs'));
    await script();
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    const [, firstLine] = err.stack.split('\n');
    const [, lineNumber] = firstLine.split(':');
    assert.strictEqual(parseInt(lineNumber, 10), 4);
  }
});

test('Error.empty.js', async t => {
  try {
    await readScript(target('error.empty.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});
