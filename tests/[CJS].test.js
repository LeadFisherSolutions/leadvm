'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const leadvm = require('..');

const SCRIPT_FIELDS = ['__dirname', '__filename', 'type', 'access', 'script', 'context', 'exports'];
const target = name => path.join(__dirname, 'examples', name);

test('Eval error [CJS]', async test => {
  try {
    leadvm.createScript(`module.exports = eval('100 * 2');`, { type: 'cjs' });
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});

test('[CJS] Access for stub function', async t => {
  const src = `
    const fs = require('fs');
    module.exports = {
      async useStub() {
        return new Promise((resolve) => {
          fs.readFile('name', (err,data) => {resolve(data);});
        });
      }
    };
  `;
  const ms = leadvm.createScript(src, {
    access: {
      fs: {
        readFile(filename, callback) {
          callback(null, 'stub-content');
        },
      },
    },
    type: 'cjs',
  });
  const res = await ms.exports.useStub();
  assert.strictEqual(res, 'stub-content');
});

test('[CJS] Access nestsed commonjs', async test => {
  const sandbox = { console };
  sandbox.global = sandbox;
  const src = `module.exports = require('./examples/module.cjs');`;
  const ms = leadvm.createScript(src, {
    context: leadvm.createContext(Object.freeze(sandbox)),
    __dirname,
    access: {
      [path.join(__dirname, 'examples', 'module.cjs')]: true,
      [path.join(__dirname, 'examples', 'module.nested.js')]: true,
    },
    type: 'cjs',
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('[CJS] Access folder [path prefix]', async test => {
  const src = `module.exports = require('./examples/module.cjs');`;
  const ms = leadvm.createScript(src, {
    __dirname,
    access: { [path.join(__dirname, 'examples')]: true },
    type: 'cjs',
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('[CJS] Access with readScript', async test => {
  const ms = await leadvm.readScript(target('module.cjs'), {
    __dirname: path.join(__dirname, 'examples'),
    access: { [path.join(__dirname, 'examples', 'module.nested.js')]: true },
    type: 'cjs',
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('[CJS] Access nested not permitted', async test => {
  try {
    const src = `module.exports = require('./examples/module.cjs');`;
    const ms = leadvm.createScript(src, {
      __dirname,
      access: { [path.join(__dirname, 'examples', './module.cjs')]: true },
      type: 'cjs',
    });
    assert.fail(new Error('Should not be loaded.'));
  } catch (err) {
    assert.strictEqual(err.message, `Access denied './module.nested.js'`);
  }
});

test('[CJS] Access nestsed npm modules', async test => {
  const src = `module.exports = require('node:test');`;
  const ms = leadvm.createScript(src, { access: { 'node:test': true }, type: 'cjs' });
  assert.strictEqual(typeof ms.exports, 'function');
});
