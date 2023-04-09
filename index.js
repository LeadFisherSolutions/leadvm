'use strict';

const vm = require('node:vm');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const { CONTEXT_OPTIONS, EMPTY_CONTEXT, COMMON_CONTEXT, MODULE_TYPES, RUN_OPTIONS } = require('./src/config');
const { useStrict, addExt, wrapSource } = require('./src/utils');
const DIR = '.' + path.sep;

const internalRequire = require;

const createContext = (context, preventEscape = false) => {
  if (!context) return EMPTY_CONTEXT;
  const options = preventEscape ? { microtaskMode: 'afterEvaluate' } : {};
  return vm.createContext(context, { ...CONTEXT_OPTIONS, ...options });
};

class VMError extends Error {}

class Script {
  constructor(name, src, options = {}) {
    this.name = name;
    this.dirname = options.dirname || process.cwd();
    this.relative = options.relative || '.';
    this.type = options.type || MODULE_TYPES.DEFAULT;
    this.access = options.access || {};
    this.#init(name, src, options);
  }

  #init = (name, src, options) => {
    const strict = useStrict(src);
    const commonjs = this.type === MODULE_TYPES.COMMONJS;
    const code = commonjs ? wrapSource(src) : `{\n${src}\n}`;
    const lineOffset = !strict ? -1 : -2;
    const scriptOptions = { filename: name, ...options, lineOffset };
    this.script = new vm.Script(strict + code, scriptOptions);
    this.context = options.context || createContext();
    const runOptions = { ...RUN_OPTIONS, ...options };
    const exports = this.script.runInContext(this.context, runOptions);
    this.exports = commonjs ? this.#commonExports(exports) : exports;
  };

  #commonExports(closure) {
    const exports = {};
    const module = { exports };
    const require = this.#createRequire();
    const __filename = this.name;
    const __dirname = path.dirname(__filename);
    closure(exports, require, module, __filename, __dirname);
    return module.exports || exports;
  }

  #checkAccess(name) {
    const dir = path.join(name);
    for (const key of Object.keys(this.access)) {
      if (!dir.startsWith(path.join(key))) continue;
      return Reflect.get(this.access, key);
    }
    return null;
  }

  #createRequire = () => {
    const { context, type } = this;
    let { dirname, relative, access } = this;

    const require = module => {
      let name = module;
      let lib = this.#checkAccess(name);
      if (lib instanceof Object) return lib;
      const npm = !name.includes('.');
      if (!npm) {
        name = path.resolve(dirname, relative, addExt(name, 'js'));
        lib = this.#checkAccess(DIR + path.relative(dirname, name));
        if (lib instanceof Object) return lib;
      }

      if (!lib) throw new VMError(`Access denied '${module}'`);

      try {
        const absolute = internalRequire.resolve(name);
        if (npm && absolute === name) return internalRequire(name);
        relative = path.dirname(absolute);

        if (npm) {
          dirname = relative;
          access = { ...access, [DIR]: true };
          relative = '.';
        }

        const src = fs.readFileSync(absolute, 'utf8');
        const opt = { context, type, dirname, relative, access };
        const script = new Script(name, src, opt);
        return script.exports;
      } catch (err) {
        if (err instanceof VMError) throw err;
        throw new VMError(`Cannot find module '${module}'`);
      }
    };

    return require;
  };
}

const readScript = async (filePath, options = {}) => {
  const resource = await fsp.readFile(filePath, 'utf8');
  if (!resource) throw new SyntaxError(`File ${filePath} is empty`);
  const name = options.filename ?? path.basename(filePath, '.js');
  return new Script(name, resource, options);
};

const createScript = (name, src, options) => new Script(name, src, options);

module.exports = { Script, readScript, createContext, createScript, COMMON_CONTEXT, MODULE_TYPES };
