'use strict';

const { basename, extname, join, dirname } = require('node:path');
const { readFile, readdir, stat } = require('node:fs').promises;
const { COMMON_CTX, MODULE_TYPES } = require('./lib/config');
const { createCtx, scriptType } = require('./lib/utils');
const exec = require('./lib/exec');

const readScript = async (path, options = {}) => {
  const src = await readFile(path, 'utf8');
  if (!src) throw new SyntaxError(`File ${path} is empty`);
  const filename = basename(path);
  return exec(src, { ...options, filename, dir: dirname(path), type: scriptType(filename) });
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

const read = async (path, options = {}, deep = true) => {
  const file = await stat(path);
  const result = await (file.isDirectory() ? readDir(path, options, deep) : readScript(path, options));
  return result;
};

module.exports = { exec, read, readScript, readDir, createCtx, COMMON_CTX };
