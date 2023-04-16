'use strict';

const { createContext } = require('node:vm');

const MODULE_TYPES = ['js', 'cjs'];
const RUN_OPTIONS = { timeout: 1000 };
const CONTEXT_OPTIONS = { codeGeneration: { strings: false, wasm: false } };

const EMPTY_CONTEXT = createContext(Object.freeze({}), CONTEXT_OPTIONS);
const COMMON_CONTEXT = createContext(
  Object.freeze({
    clearImmediate,
    clearInterval,
    clearTimeout,
    setInterval,
    setImmediate,
    setTimeout,
    URL,
    URLSearchParams,
    Buffer,
    TextDecoder,
    TextEncoder,
    console,
    queueMicrotask,
  }),
);

const WRAPPERS = {
  js: src => `{\n${src}\n}`,
  cjs: src => `(({exports, require, module, __filename, __dirname}) => {\n${src}\n});`,
};

module.exports = {
  EMPTY_CONTEXT,
  CONTEXT_OPTIONS,
  COMMON_CONTEXT,
  MODULE_TYPES,
  RUN_OPTIONS,
  WRAPPERS,
};
