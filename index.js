'use strict';

const { basename, extname, join, dirname } = require('node:path');
const { promises } = require('node:fs');
const { readFile, readdir } = promises;

const Script = require('./src/script');
const { COMMON_CTX, MODULE_TYPES } = require('./src/config');
const { createContext, VMOptions } = require('./src/utils');

const readScript = async (filePath, options = {}) => {
  const src = await readFile(filePath, 'utf8');
  if (!src) throw new SyntaxError(`File ${filePath} is empty`);
  return new Script(src, new VMOptions(options, { __filename: basename(filePath), __dirname: dirname(filePath) }));
};

const readDir = async (dir, options = {}, deep = true) => {
  const files = await readdir(dir, { withFileTypes: true });
  const scripts = {};

  const loader = async (file, filePath, options) => {
    const reader = file.isFile() ? readScript : readDir;
    const ext = extname(file.name);
    scripts[basename(file.name, MODULE_TYPES.includes(ext) ? ext : '')] = await reader(filePath, options);
  };

  // prettier-ignore
  await Promise.all(files.reduce((acc, file) => {
    if ((file.isFile() && !file.name.endsWith('js')) || (file.isDirectory() && !deep)) return acc;
    return acc.push(loader(file, join(dir, file.name), options)), acc;
  }, []));

  return scripts;
};

const createScript = (src, options) => new Script(src, options);
module.exports = { Script, readScript, readDir, createContext, createScript, COMMON_CTX };
