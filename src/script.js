'use strict';

const vm = require('node:vm');

const createRequire = require('./require');
const { RUN_OPTS } = require('./config');
const { wrapSource, VMOptions, createContext, cjs } = require('./utils');

class Script {
  constructor(src, options = {}) {
    const builded = options instanceof VMOptions ? options : new VMOptions(options);
    const { __dirname, __filename, type, access } = builded;

    this.__dirname = __dirname;
    this.__filename = __filename;
    this.type = type;
    this.access = access;

    this.#run(src, builded);
  }

  #run = (src, options) => {
    const { __filename, __dirname, type } = this;
    const defaultCTX = { require: createRequire(options, Script), __filename, __dirname };
    const lineOffset = type === 'cjs' ? -1 : -2;
    this.script = new vm.Script(wrapSource(src, type), { filename: __filename, lineOffset, ...options.scriptOptions });

    if (type === 'js') this.context = createContext(Object.freeze({ ...defaultCTX, ...options.context }));
    else this.context = options.context ?? createContext();

    const exports = this.script.runInContext(this.context, { ...RUN_OPTS, ...options.runOptions });
    this.exports = type === 'cjs' ? cjs(exports, defaultCTX) : exports;
  };
}

module.exports = Script;
