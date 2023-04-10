const vm = require('node:vm');

const CONTEXT_OPTIONS = { codeGeneration: { strings: false, wasm: false } }; //? Code generation configuration

const EMPTY_CONTEXT = vm.createContext(Object.freeze({}), CONTEXT_OPTIONS); //? Without all, global = {}

const intervals = { clearImmediate, clearInterval, clearTimeout, setInterval, setImmediate, setTimeout };
const url = { URL, URLSearchParams };
const context = Object.freeze({ Buffer, TextDecoder, TextEncoder, console, queueMicrotask, ...url, ...intervals });
const COMMON_CONTEXT = vm.createContext(context); //? All frequently used integrated API, without global link

const MODULE_TYPES = {
  DEFAULT: 'default', //? Last action / variable
  COMMONJS: 'commonjs', //? module.exports
};

const RUN_OPTIONS = { timeout: 1000 }; //? 1s timeout for script execution

module.exports = {
  EMPTY_CONTEXT,
  CONTEXT_OPTIONS,
  COMMON_CONTEXT,
  MODULE_TYPES,
  RUN_OPTIONS,
};
