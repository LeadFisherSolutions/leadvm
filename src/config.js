'use strict';

const { createContext } = require('node:vm');

const MODULE_TYPES = ['js', 'cjs'];
const RUN_OPTS = { timeout: 1000 };
const CTX_OPTIONS = { codeGeneration: { strings: false, wasm: false } };

const EMPTY_CTX = createContext(Object.freeze({}), CTX_OPTIONS);
const COMMON_CTX = createContext(
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

const DEFAULT_OPTS = { scriptOptions: {}, access: {}, runOptions: {}, __dirname: process.cwd(), __filename: 'N404.js' };

const WRAPPERS = {
  js: src => `{\n${src}\n}`,
  cjs: src => `(({exports, require, module, __filename, __dirname}) => {\n${src}\n});`,
};

module.exports = { EMPTY_CTX, CTX_OPTIONS, COMMON_CTX, MODULE_TYPES, RUN_OPTS, WRAPPERS, DEFAULT_OPTS };
