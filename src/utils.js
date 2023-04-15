'use strict';

const { MODULE_TYPES, CONTEXT_OPTIONS, EMPTY_CONTEXT } = require('./config');
const vm = require('vm');
const path = require('path');

const scriptType = name => {
  const type = name.includes('.') ? name.split('.').at(-1) : MODULE_TYPES[0];
  return MODULE_TYPES.includes(type) ? type : MODULE_TYPES[0];
};

class VMError extends Error {}
class VMOptions {
  constructor(options, names = {}) {
    Object.entries(options).forEach(([key, value]) => (this[key] = value));
    this.__dirname = options.__dirname ?? names.__dirname ?? process.cwd();
    this.__filename = options.__filename ?? names.__filename ?? 'LeadFisher.js';
    this.scriptOptions = options.scriptOptions || {};
    this.access = options.access ?? {};
    this.runOptions = options.runOptions || {};
    if (!this.type) this.type = scriptType(this.__filename);
  }
}

const wrappers = {
  js: src => `{\n${src}\n}`,
  cjs: src => `(({exports, require, module, __filename, __dirname}) => { ${src}\n});`,
};

const USE_STRICT = `'use strict';`;
const wrapSource = (src, ext = 'js') => `${USE_STRICT}\n${wrappers[ext](src.replace(USE_STRICT, ''))}`;

const checkAccess = (module, options, npm) => {
  const dir = path.join(module);
  for (const key of Object.keys(options.access)) {
    if (!dir.startsWith(key)) continue;
    return Reflect.get(options.access, key);
  }
  return null;
};

const createContext = (context, preventEscape = false) => {
  if (!context) return EMPTY_CONTEXT;
  const options = preventEscape ? { microtaskMode: 'afterEvaluate' } : {};
  return vm.createContext(context, { ...CONTEXT_OPTIONS, ...options });
};

module.exports = {
  wrapSource,
  VMError,
  VMOptions,
  createContext,
  checkAccess,
  scriptType,
};
