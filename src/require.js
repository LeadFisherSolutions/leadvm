'use strict';

const { readFileSync } = require('node:fs');
const { basename, dirname, resolve } = require('node:path');
const { VMError, checkAccess, scriptType } = require('./utils');
const internalRequire = require;

const createRequire = (options, Script) => {
  const { __dirname, npmVm } = options;

  const require = module => {
    let name = module;
    const npm = !module.includes('.');
    if (!npm) name = resolve(__dirname, module);

    const lib = checkAccess(name, options);
    if (lib instanceof Object) return lib;

    if (!lib) throw new VMError(`Access denied '${module}'`);
    try {
      const absolute = internalRequire.resolve(name);
      if (npm && absolute === name) return internalRequire(name); //? Integrated nodejs API
      if (npm && !npmVm) return internalRequire(absolute); //?  VM uncover Npm packages

      name = basename(absolute);
      const updatedOptions = { ...options, __filename: name, __dirname: dirname(absolute), type: scriptType(name) };
      const script = new Script(readFileSync(absolute, 'utf8'), updatedOptions, name);
      return script.exports;
    } catch (err) {
      if (err instanceof VMError) throw err;
      throw new VMError(`Cannot find module '${module}'`);
    }
  };

  return require;
};

module.exports = createRequire;
