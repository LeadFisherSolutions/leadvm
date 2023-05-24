'use strict';

const { createContext } = require('node:vm');

const WRAPPERS = {
  js: src => `{\n${src}\n}`,
  cjs: src => `(({exports, require, module, __filename, __dirname}) => {\n${src}\n});`,
};

const MODULE_TYPES = ['js', 'cjs'];
const RUN_OPTS = { timeout: 1000 };
const buffer = { Buffer, TextDecoder, TextEncoder };
const CTX_OPTS = { codeGeneration: { strings: false, wasm: false } };
const timers = { clearImmediate, clearInterval, clearTimeout, setInterval, setImmediate, setTimeout };
const ctx = Object.freeze({ ...timers, ...buffer, URL, URLSearchParams, console, queueMicrotask });
const [EMPTY_CTX, COMMON_CTX] = [createContext(Object.freeze({}), CTX_OPTS), createContext(ctx, CTX_OPTS)];

module.exports = { EMPTY_CTX, CTX_OPTS, COMMON_CTX, MODULE_TYPES, RUN_OPTS, WRAPPERS };
