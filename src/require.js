'use strict';

const { readFileSync } = require('node:fs');
const { basename, dirname, resolve } = require('node:path');
const { VMError, checkAccess, scriptType } = require('./utils');
const internalRequire = require;

const createRequire = (options, Script) => {
  const { __dirname, npmIsolation, access } = options;
  return module => {
    const npm = !module.includes('.');
    const name = !npm ? resolve(__dirname, module) : module;
    const lib = checkAccess(name, access);

    if (lib instanceof Object) return lib;
    if (!lib) throw new VMError(`Access denied '${module}'`);
    try {
      const absolute = internalRequire.resolve(name);
      if (npm && absolute === name) return internalRequire(name); //? Integrated nodejs API
      if (npm && !npmIsolation) return internalRequire(absolute); //?  VM uncover Npm packages

      const [__filename, __dirname] = [basename(absolute), dirname(absolute)];
      const type = scriptType(__filename);
      return new Script(readFileSync(absolute, 'utf8'), { ...options, __filename, __dirname, type }).exports;
    } catch (err) {
      if (err instanceof VMError) throw err;
      throw new VMError(`Cannot find module '${module}'`);
    }
  };
};

module.exports = createRequire;
