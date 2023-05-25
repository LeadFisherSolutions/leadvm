'use strict';

const { createCtx, scriptType } = require('./utils');
const createRequire = require('./require');
const { RUN_OPTS, WRAPPERS } = require('./config');
const vm = require('node:vm');

const cjs = (closure, options) => {
  const exports = {};
  const module = { exports };
  closure({ exports, module, ...options });
  return module.exports;
};

const wrapSrc = (src, ext = 'js') => `'use strict';\n${WRAPPERS[ext](src.replace(/'use strict';\n?/, ''))}`;
const exec = (src, settings = {}) => {
  const { script = {}, run = {}, ctx = {} } = settings;
  const type = settings.type ?? (settings.filename ? scriptType(settings.filename) : 'js');
  const [filename, dir] = [settings.filename ?? '', settings.dir ?? process.cwd()];
  const updatedSettings = { ...settings, script, run, ctx, filename, dir, type };

  const isJS = type === 'js';
  const defaultCTX = { require: createRequire(updatedSettings, exec), __filename: filename, __dirname: dir };
  const runner = new vm.Script(wrapSrc(src, type), { filename, lineOffset: -1 - isJS, ...script });
  const context = isJS ? createCtx(Object.freeze({ ...defaultCTX, ...ctx })) : createCtx(ctx);
  const exports = runner.runInContext(context, { ...RUN_OPTS, ...run });
  return isJS ? exports : cjs(exports, defaultCTX);
};

module.exports = exec;
