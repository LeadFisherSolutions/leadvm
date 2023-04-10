const test = require('node:test');
const path = require('node:path');
const leadvm = require('..');
const assert = require('node:assert');

const target = name => path.join(__dirname, 'examples', name);
const SCRIPT_FIELDS = ['name', 'dirname', 'relative', 'type', 'access', 'script', 'context', 'exports'];

test('[DEFAULT]', async t => {
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

test('[DEFAULT] Simple.js', async t => {
  const ms = await leadvm.readScript(target('simple.js'));

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field', 'add', 'sub']);
  assert.strictEqual(ms.exports.field, 'value');
  assert.strictEqual(ms.exports.add(2, 3), 5);
  assert.strictEqual(ms.exports.sub(2, 3), -1);
});

test('[DEFAULT] Simple (from non extension file)', async t => {
  const ms = await leadvm.readScript(target('simple'));

  assert.strictEqual(typeof ms.exports, 'object');
  assert.deepStrictEqual(Object.keys(ms), SCRIPT_FIELDS);
  assert.deepStrictEqual(Object.keys(ms.exports), ['field', 'add', 'sub']);
  assert.strictEqual(ms.exports.field, 'value');
  assert.strictEqual(ms.exports.add(2, 3), 5);
  assert.strictEqual(ms.exports.sub(2, 3), -1);
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

test('[DEFAULT] Arrow.js', async t => {
  const ms = await leadvm.readScript(target('arrow.js'));

  assert.strictEqual(typeof ms.exports, 'function');
  assert.strictEqual(ms.exports.toString(), '(a, b) => a + b');
  assert.strictEqual(ms.exports(2, 3), 5);
  assert.strictEqual(ms.exports(-1, 1), 0);
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

test('[DEFAULT] Error.notfound.js', async t => {
  let ms;
  try {
    ms = await leadvm.readScript(target('error.notfound.js'));
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.code, 'ENOENT');
  }
  assert.strictEqual(ms, undefined);
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

test('[DEFAULT] Error.reference.js (line number)', async t => {
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
    const script = await leadvm.readScript(target('error.strict.cjs'));
    await script.exports();
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    const [, firstLine] = err.stack.split('\n');
    const [, lineNumber] = firstLine.split(':');
    assert.strictEqual(parseInt(lineNumber, 10), 4);
  }
});

test('[DEFAULT] Create Default Context', async t => {
  const context = leadvm.createContext();
  assert.deepEqual(Object.keys(context), []);
  assert.strictEqual(context.global, undefined);
});

test('[DEFAULT] Create Common Context', async t => {
  const context = leadvm.createContext(leadvm.COMMON_CONTEXT);
  assert.strictEqual(typeof context, 'object');
  assert.strictEqual(context.console, console);
  assert.strictEqual(context.global, undefined);
});

test('[DEFAULT] Create Custom Context', async t => {
  const sandbox = { field: 'value' };
  sandbox.global = sandbox;
  const context = leadvm.createContext(Object.freeze(sandbox));
  assert.strictEqual(context.field, 'value');
  assert.deepEqual(Object.keys(context), ['field', 'global']);
  assert.strictEqual(context.global, sandbox);
});

test('[DEFAULT] Call undefined as a function', async t => {
  try {
    const script = await leadvm.readScript(target('error.undef.js'));
    await script.exports();
    assert.fail(new Error('Should throw an error.'));
  } catch (err) {
    assert.strictEqual(err.constructor.name, 'TypeError');
  }
});

test('[CJS] Access for node internal module', async t => {
  const sandbox = {};
  sandbox.global = sandbox;
  const src = `module.exports = { fs: require('fs') };`;
  const ms = leadvm.createScript('Example', src, {
    context: leadvm.createContext(Object.freeze(sandbox)),
    dirname: __dirname,
    access: { fs: true },
    type: leadvm.MODULE_TYPES.COMMONJS,
  });
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
  const ms = leadvm.createScript('Example', src, {
    access: {
      fs: {
        readFile(filename, callback) {
          callback(null, 'stub-content');
        },
      },
    },
    type: leadvm.MODULE_TYPES.COMMONJS,
  });

  const res = await ms.exports.useStub();
  assert.strictEqual(res, 'stub-content');
});

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
