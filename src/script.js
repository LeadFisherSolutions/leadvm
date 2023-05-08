'use strict';

const vm = require('node:vm');

const createRequire = require('./require');
const { RUN_OPTIONS } = require('./config');
const { wrapSource, VMOptions, createContext } = require('./utils');

class Script {
  #default;

  constructor(src, options = {}) {
    let builded = options;
    if (options instanceof VMOptions) console.log(options instanceof VMOptions);
    if (!(options instanceof VMOptions)) builded = new VMOptions(options);
    const { __dirname, __filename, type, access } = builded;

    this.__dirname = __dirname;
    this.__filename = __filename;
    this.type = type;
    this.access = access;
    this.#default = { require: createRequire(builded, Script), __filename, __dirname };

    this.#init(src, builded);
  }

  #init = (src, options) => {
    const { context, type, __filename, runOptions } = options;
    const scriptOptions = { filename: __filename, lineOffset: type === 'cjs' ? -1 : -2, ...options.scriptOptions };
    this.script = new vm.Script(wrapSource(src, type), scriptOptions);

    if (type === 'js') this.context = createContext(Object.freeze({ ...context, ...this.#default }));
    else this.context = context ?? createContext();

    const exports = this.script.runInContext(this.context, { ...RUN_OPTIONS, ...runOptions });
    this.exports = type === 'cjs' ? this.#cjs(exports) : exports;
  };

  #cjs(closure) {
    const exports = {};
    const module = { exports };
    closure({ exports, module, ...this.#default });
    return module.exports;
  }
}

module.exports = Script;
