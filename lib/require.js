'use strict';

const { scriptType } = require('./utils');
const { basename, dirname, resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const checkAccess = (module, access) => {
  if (!access) return null;
  const dir = path.join(module);
  for (const key of Object.keys(access)) {
    if (!dir.startsWith(key)) continue;
    return Reflect.get(access, key);
  }
  return null;
};

class VMError extends Error {}
const internalRequire = require;
module.exports = (options, execute) => {
  const { dir, npmIsolation, access } = options;
  return module => {
    const npm = !module.includes('.');
    const name = !npm ? resolve(dir, module) : module;
    const lib = checkAccess(name, access);

    if (lib instanceof Object) return lib;
    if (!lib) throw new VMError(`Access denied '${module}'`);
    try {
      const absolute = internalRequire.resolve(name);
      if (npm && absolute === name) return internalRequire(name); //? Integrated nodejs API
      if (npm && !npmIsolation) return internalRequire(absolute); //?  VM uncover Npm packages
      const [filename, dir] = [basename(absolute), dirname(absolute)];
      return execute(readFileSync(absolute, 'utf8'), { ...options, filename, dir, type: scriptType(filename) });
    } catch (err) {
      if (err instanceof VMError) throw err;
      throw new VMError(`Cannot find module '${module}'`);
    }
  };
};
