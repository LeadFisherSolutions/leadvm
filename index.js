'use strict';

const { basename, extname, join, dirname } = require('node:path');
const { COMMON_CTX, MODULE_TYPES } = require('./lib/config');
const { createContext, scriptType } = require('./lib/utils');
const { readFile, readdir } = require('node:fs').promises;
const execute = require('./lib/exec');

const readScript = async (path, options = {}) => {
  const src = await readFile(path, 'utf8');
  if (!src) throw new SyntaxError(`File ${path} is empty`);
  const filename = basename(path);
  return execute(src, { ...options, filename, dir: dirname(path), type: scriptType(filename) });
};

const readDir = async (dir, options = {}, deep = true) => {
  const files = await readdir(dir, { withFileTypes: true });
  const scripts = {};

  const loader = async (file, path) => {
    const [reader, ext] = [file.isFile() ? readScript : readDir, extname(file.name)];
    scripts[basename(file.name, MODULE_TYPES.includes(ext.slice(1)) ? ext : '')] = await reader(path, options);
  };

  // prettier-ignore
  await Promise.all(files.reduce((acc, file) => {
    if ((file.isDirectory() && !deep)) return acc;
    return acc.push(loader(file, join(dir, file.name))), acc;
  }, []));

  return scripts;
};

module.exports = { execute, readScript, readDir, createContext, COMMON_CTX };
