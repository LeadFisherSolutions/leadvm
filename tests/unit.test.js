const test = require('node:test');
const path = require('node:path');
const vm = require('../index');
const assert = require('node:assert');

const target = name => path.join(__dirname, 'examples', name);
const examples = path.join(__dirname, 'examples');
const SCRIPT_FIELDS = ['name', 'dirname', 'relative', 'type', 'access', 'script', 'context', 'exports'];

test('Script constructor', async t => {
  const script = `({field: 'value'});`;
  const ms = new vm.Script('Example', script);

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field']);
  assert.strictEqual(ms.exports.field, 'value');
});

test('Script factory', async t => {
  const script = `({field: 'value'});`;
  const ms = vm.createScript('Example', script);

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field']);
  assert.strictEqual(ms.exports.field, 'value');
});

test('Object.js', async t => {
  const path = target('object.js');
  const ms = await vm.readScript(path);

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field', 'add', 'sub']);
  assert.strictEqual(ms.exports.field, 'value');
  assert.strictEqual(ms.exports.add(2, 3), 5);
  assert.strictEqual(ms.exports.sub(2, 3), -1);
});

test('Arrow.js', async t => {
  const path = target('arrow.js');
  const ms = await vm.readScript(path);

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.toString(), '(a, b) => a + b');
  assert.strictEqual(ms.exports(2, 3), 5);
  assert.strictEqual(ms.exports(-1, 1), 0);
});

test('Error.empty.js', async t => {
  try {
    const path = target('error.empty.js');
    await vm.readScript(path);
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});

test('Complex.js', async t => {
  const path = target('complex.js');
  const context = vm.createContext({ setTimeout });
  const options = { filename: 'CUSTOM FILE NAME', context };

  const ms = await vm.readScript(path, options);
  assert.strictEqual(ms.constructor.name, 'Script');
  ms.exports.add(2, 3, (err, sum) => {
    assert.strictEqual(err.constructor.name === 'Error', true);
    assert.strictEqual(sum, 5);
    assert.strictEqual(err.stack.includes('CUSTOM FILE NAME'), true);
    assert.strictEqual(err.message, 'Custom error');
  });
});

test('Function.js', async t => {
  const path = target('function.js');
  const ms = await vm.readScript(path);

  assert.strictEqual(typeof ms.exports, 'function');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.strictEqual(ms.exports(2, 3), 6);
  assert.strictEqual(ms.exports.bind(null, 3)(4), 12);
});

test('Async.js', async t => {
  const path = target('async.js');
  const ms = await vm.readScript(path);

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.constructor.name, 'AsyncFunction');
  const result = await ms.exports('str', { field: 'value' });
  assert.deepEqual(result, { name: 'str', data: { field: 'value' } });
  assert.rejects(ms.exports('', { field: 'value' }));
});

test('Local.js', async t => {
  const path = target('local.js');
  const ms = await vm.readScript(path);

  const result = await ms.exports('str');
  assert.deepEqual(result, { args: ['str'], local: 'hello' });
});

test('Error.syntax.js', async t => {
  try {
    const path = target('error.syntax.js');
    await vm.readScript(path);
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'SyntaxError');
  }
});

test('Error.reference.js', async t => {
  try {
    const path = target('error.reference.js');
    const script = await vm.readScript(path);
    await script.exports();

    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'ReferenceError');
  }
});

//? Access for stub module

test('Access internal not permitted', async test => {
  try {
    const src = `const fs = require('fs');`;
    const ms = vm.createScript('Example', src, { type: vm.MODULE_TYPES.COMMONJS });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'fs'`);
  }
});

test('Access non-existent not permitted', async test => {
  try {
    const src = `const notExist = require('nothing');`;
    const ms = vm.createScript('Example', src, { type: vm.MODULE_TYPES.COMMONJS });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Access denied 'nothing'`);
  }
});

test('Access non-existent module', async test => {
  try {
    const src = `const notExist = require('leadfisher');`;
    const ms = vm.createScript('Example', src, {
      access: {
        leadfisher: true,
      },
      type: vm.MODULE_TYPES.COMMONJS,
    });
    assert.strictEqual(ms, undefined);
  } catch (err) {
    assert.strictEqual(err.message, `Cannot find module 'leadfisher'`);
  }
});

test('Access nestsed commonjs', async test => {
  const sandbox = {};
  sandbox.global = sandbox;
  const src = `module.exports = require('./examples/module.js');`;
  const ms = vm.createScript('Example', src, {
    context: vm.createContext(sandbox),
    dirname: __dirname,
    access: {
      './examples/module.js': true,
      './examples/module.nested.js': true,
    },
    type: vm.MODULE_TYPES.COMMONJS,
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('Access folder [path prefix]', async test => {
  const src = `module.exports = require('./examples/module.js');`;
  const ms = vm.createScript('Example', src, {
    dirname: __dirname,
    access: {
      './examples': true,
    },
    type: vm.MODULE_TYPES.COMMONJS,
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('Access with readScript', async test => {
  const path = target('module.js');
  const ms = await vm.readScript(path, {
    dirname: examples,
    access: {
      './module.nested.js': true,
    },
    type: vm.MODULE_TYPES.COMMONJS,
  });
  assert.strictEqual(ms.exports.value, 1);
  assert.strictEqual(ms.exports.nested.value, 2);
});

test('Access nested not permitted', async test => {
  try {
    const src = `module.exports = require('./examples/module.js');`;
    const ms = vm.createScript('Example', src, {
      dirname: __dirname,
      access: {
        './examples/module.js': true,
      },
      type: vm.MODULE_TYPES.COMMONJS,
    });
    assert.fail(new Error('Should not be loaded.'));
  } catch (err) {
    const module2 = './module.nested.js';
    assert.strictEqual(err.message, `Access denied '${module2}'`);
  }
});

test('Access nestsed npm modules', async test => {
  const src = `module.exports = require('node:test');`;
  const ms = vm.createScript('Example', src, { access: { 'node:test': true }, type: vm.MODULE_TYPES.COMMONJS });
  assert.strictEqual(typeof ms.exports, 'function');
});

test('Eval error [commonjs]', async test => {
  const src = `module.exports = eval('100 * 2');`;
  try {
    vm.createScript('Example', src, { type: vm.MODULE_TYPES.COMMONJS });
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});

test('Eval error [default]', async test => {
  const src = `eval('100 * 2')`;
  try {
    vm.createScript('Example', src);
    assert.fail(new Error('Should throw an error.'));
  } catch (error) {
    assert.strictEqual(error.constructor.name, 'EvalError');
  }
});
