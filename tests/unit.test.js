const test = require('node:test');
const path = require('node:path');
const leadvm = require('..');
const assert = require('node:assert');

const target = name => path.join(__dirname, 'examples', name);
const SCRIPT_FIELDS = ['name', 'dirname', 'relative', 'type', 'access', 'script', 'context', 'exports'];

test('[DEFAULT] Script constructor', async t => {
  const ms = new leadvm.Script('Example', `({field: 'value'});`);

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field']);
  assert.strictEqual(ms.exports.field, 'value');
});

test('[DEFAULT] Script factory', async t => {
  const ms = leadvm.createScript('Example', `({field: 'value'});`);

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field']);
  assert.strictEqual(ms.exports.field, 'value');
});

test('[DEFAULT] Object.js', async t => {
  const ms = await leadvm.readScript(target('object.js'));

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field', 'add', 'sub']);
  assert.strictEqual(ms.exports.field, 'value');
  assert.strictEqual(ms.exports.add(2, 3), 5);
  assert.strictEqual(ms.exports.sub(2, 3), -1);
});

test('[DEFAULT] Arrow.js', async t => {
  const ms = await leadvm.readScript(target('arrow.js'));

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.toString(), '(a, b) => a + b');
  assert.strictEqual(ms.exports(2, 3), 5);
  assert.strictEqual(ms.exports(-1, 1), 0);
});

test('[DEFAULT] Error.empty.js', async t => {
  try {
    await leadvm.readScript(target('error.empty.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});

test('[DEFAULT] Complex.js', async t => {
  const context = leadvm.createContext({ setTimeout });
  const options = { filename: 'CUSTOM FILE NAME', context };
  const ms = await leadvm.readScript(target('complex.js'), options);

  assert.strictEqual(ms.constructor.name, 'Script');
  ms.exports.add(2, 3, (err, sum) => {
    assert.strictEqual(err.constructor.name === 'Error', true);
    assert.strictEqual(sum, 5);
    assert.strictEqual(err.stack.includes('CUSTOM FILE NAME'), true);
    assert.strictEqual(err.message, 'Custom error');
  });
});

test('[DEFAULT] Function.js', async t => {
  const ms = await leadvm.readScript(target('function.js'));

  assert.strictEqual(typeof ms.exports, 'function');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.strictEqual(ms.exports(2, 3), 6);
  assert.strictEqual(ms.exports.bind(null, 3)(4), 12);
});

test('[DEFAULT] Async.js', async t => {
  const ms = await leadvm.readScript(target('async.js'));
  const result = await ms.exports('str', { field: 'value' });

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.constructor.name, 'AsyncFunction');
  assert.deepEqual(result, { name: 'str', data: { field: 'value' } });
  assert.rejects(ms.exports('', { field: 'value' }));
});

test('[DEFAULT] Local.js', async t => {
  const ms = await leadvm.readScript(target('local.js'));
  const result = await ms.exports('str');

  assert.deepEqual(result, { args: ['str'], local: 'hello' });
});

test('[DEFAULT] Error.syntax.js', async t => {
  try {
    await leadvm.readScript(target('error.syntax.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});

test('[DEFAULT] Error.reference.js', async t => {
  try {
    const script = await leadvm.readScript(target('error.reference.js'));
    await script.exports();

    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'ReferenceError');
  }
});

//? Access for stub module

test('[CJS] Access internal not permitted', async test => {
  try {
    const ms = leadvm.createScript('Example', `const fs = require('fs');`, { type: leadvm.MODULE_TYPES.COMMONJS });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'fs'`);
  }
});

test('[CJS] Access non-existent not permitted', async test => {
  try {
    const src = `const notExist = require('nothing');`;
    const ms = leadvm.createScript('Example', src, { type: leadvm.MODULE_TYPES.COMMONJS });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'nothing'`);
  }
});

test('[CJS] Access non-existent npm module', async test => {
  try {
    const ms = leadvm.createScript('Example', `const notExist = require('leadfisher');`, {
      access: { leadfisher: true },
      type: leadvm.MODULE_TYPES.COMMONJS,
    });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Cannot find module 'leadfisher'`);
  }
});

test('[CJS] Access nestsed commonjs', async test => {
  const sandbox = {};
  sandbox.global = sandbox;
  const src = `module.exports = require('./examples/module.js');`;
  const ms = leadvm.createScript('Example', src, {
    context: leadvm.createContext(Object.freeze(sandbox)),
    dirname: __dirname,
    access: { './examples/module.js': true, './examples/module.nested.js': true },
    type: leadvm.MODULE_TYPES.COMMONJS,
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('[CJS] Access folder [path prefix]', async test => {
  const src = `module.exports = require('./examples/module.js');`;
  const ms = leadvm.createScript('Example', src, {
    dirname: __dirname,
    access: { './examples': true },
    type: leadvm.MODULE_TYPES.COMMONJS,
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('[CJS] Access with readScript', async test => {
  const ms = await leadvm.readScript(target('module.js'), {
    dirname: path.join(__dirname, 'examples'),
    access: { './module.nested.js': true },
    type: leadvm.MODULE_TYPES.COMMONJS,
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('[CJS] Access nested not permitted', async test => {
  try {
    const src = `module.exports = require('./examples/module.js');`;
    const ms = leadvm.createScript('Example', src, {
      dirname: __dirname,
      access: { './examples/module.js': true },
      type: leadvm.MODULE_TYPES.COMMONJS,
    });
    assert.fail(new Error('Should not be loaded.'));
  } catch (err) {
    assert.strictEqual(err.message, `Access denied './module.nested.js'`);
  }
});

test('[CJS] Access nestsed npm modules', async test => {
  const src = `module.exports = require('node:test');`;
  const ms = leadvm.createScript('Example', src, { access: { 'node:test': true }, type: leadvm.MODULE_TYPES.COMMONJS });
  assert.strictEqual(typeof ms.exports, 'function');
});

test('[CJS] Eval error', async test => {
  try {
    leadvm.createScript('Example', `module.exports = eval('100 * 2');`, { type: leadvm.MODULE_TYPES.COMMONJS });
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});

test('[DEFAULT] Eval error ', async test => {
  try {
    leadvm.createScript('Example', `eval('100 * 2')`);
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});
