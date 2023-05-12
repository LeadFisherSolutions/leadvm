'use strict';

const vm = require('node:vm');
const path = require('node:path');
const { MODULE_TYPES, CTX_OPTIONS, EMPTY_CTX, WRAPPERS, DEFAULT_OPTS } = require('./config');

const scriptType = name => {
  const type = name.includes('.') ? name.split('.').at(-1) : MODULE_TYPES[0];
  return MODULE_TYPES.includes(type) ? type : MODULE_TYPES[0];
};

function VMOptions(options, names) {
  Object.assign(this, DEFAULT_OPTS);
  Object.entries(options).forEach(([key, value]) => (this[key] = value));
  this.__dirname = options.__dirname ?? names?.__dirname ?? this.__dirname;
  this.__filename = options.__filename ?? names?.__filename ?? this.__filename;
  if (!this.type) this.type = scriptType(this.__filename);
}

const checkAccess = (module, access) => {
  const dir = path.join(module);
  for (const key of Object.keys(access)) {
    if (!dir.startsWith(key)) continue;
    return Reflect.get(access, key);
  }
  return null;
};

const createContext = (context, preventEscape = false) => {
  if (!context) return EMPTY_CTX;
  const options = preventEscape ? { microtaskMode: 'afterEvaluate' } : {};
  return vm.createContext(context, { ...CTX_OPTIONS, ...options });
};

const cjs = (closure, options) => {
  const exports = {};
  const module = { exports };
  closure({ exports, module, ...options });
  return module.exports;
};

class VMError extends Error {}
const wrapSource = (src, ext = 'js') => `'use strict';\n${WRAPPERS[ext](src.replace(/'use strict';\n?/, ''))}`;
module.exports = { wrapSource, VMError, VMOptions, createContext, checkAccess, scriptType, cjs };
