const vm = require('node:vm');

const CONTEXT_OPTIONS = {
  codeGeneration: {
    strings: false,
    wasm: false,
  },
};

const EMPTY_CONTEXT = vm.createContext(Object.freeze({}), CONTEXT_OPTIONS);

const intervals = { clearImmediate, clearInterval, clearTimeout, setInterval, setImmediate, setTimeout };
const url = { URL, URLSearchParams };
const context = Object.freeze({ Buffer, TextDecoder, TextEncoder, console, queueMicrotask, ...url, ...intervals });
const COMMON_CONTEXT = vm.createContext(context);

const MODULE_TYPES = {
  DEFAULT: 'default',
  COMMONJS: 'commonjs',
  MODULE: 'module',
};

const RUN_OPTIONS = { timeout: 1000 };

module.exports = {
  EMPTY_CONTEXT,
  CONTEXT_OPTIONS,
  COMMON_CONTEXT,
  MODULE_TYPES,
  RUN_OPTIONS,
};
