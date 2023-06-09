'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { exec, createCtx, readScript } = require('../..');

const target = name => path.join(__dirname, 'examples', name);

test('Access for node internal module', async t => {
  const sandbox = {};
  sandbox.global = sandbox;
  const src = `module.exports = { fs: require('fs') };`;
  const context = createCtx(Object.freeze(sandbox));
  const ms = exec(src, { context, access: { fs: true }, type: 'cjs' });
});

test('[JS/CJS] Access non-existent npm module', async test => {
  try {
    const ms = exec(`const notExist = require('leadfisher');`, {
      access: { leadfisher: true },
      type: 'cjs',
    });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Cannot find module 'leadfisher'`);
  }

  try {
    const ms = exec(`const notExist = require('leadfisher');`, { access: { leadfisher: true } });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Cannot find module 'leadfisher'`);
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
  const ms = exec(src, {
    access: {
      fs: {
        readFile(filename, callback) {
          callback(null, 'stub-content');
        },
      },
    },
    type: 'cjs',
  });
  const res = await ms.useStub();
  assert.strictEqual(res, 'stub-content');
});

test('[CJS] Access nestsed commonjs', async test => {
  const sandbox = { console };
  sandbox.global = sandbox;
  const src = `module.exports = require('./module.cjs');`;
  const ms = exec(src, {
    ctx: createCtx(Object.freeze(sandbox)),
    dir: path.join(__dirname, 'examples'),
    access: {
      [path.join(__dirname, 'examples', 'module.cjs')]: true,
      [path.join(__dirname, 'examples', 'module.nested.js')]: true,
    },
    type: 'cjs',
  });
  assert.strictEqual(ms.value, 1);
  assert.strictEqual(ms.nested.value, 2);
});

test('[CJS] Access folder [path prefix]', async test => {
  const src = `module.exports = require('./module.cjs');`;
  const ms = exec(src, {
    dir: path.join(__dirname, 'examples'),
    access: { [path.join(__dirname)]: true },
    type: 'cjs',
  });
  assert.strictEqual(ms.value, 1);
  assert.strictEqual(ms.nested.value, 2);
});

test('[CJS] Access with readScript', async test => {
  const ms = await readScript(target('module.cjs'), {
    dir: path.join(__dirname, 'examples'),
    access: { [path.join(__dirname, 'examples', 'module.nested.js')]: true },
    type: 'cjs',
  });
  assert.strictEqual(ms.value, 1);
  assert.strictEqual(ms.nested.value, 2);
});

test('[CJS] Access nested not permitted', async test => {
  try {
    const src = `module.exports = require('./module.cjs');`;
    const ms = exec(src, {
      dir: path.join(__dirname, 'examples'),
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
  const ms = exec(src, { access: { 'node:test': true }, type: 'cjs' });
  assert.strictEqual(typeof ms, 'function');
});
