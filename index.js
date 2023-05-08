'use strict';

const { basename, extname, join, dirname } = require('node:path');
const { promises } = require('node:fs');
const { readFile, readdir } = promises;

const Script = require('./src/script');
const { COMMON_CONTEXT } = require('./src/config');
const { createContext, VMOptions } = require('./src/utils');

const createScript = (src, options) => new Script(src, options);

const readScript = async (filePath, options = {}) => {
  const src = await readFile(filePath, 'utf8');
  if (!src) throw new SyntaxError(`File ${filePath} is empty`);
  const buildedOptions = new VMOptions(options, { __filename: basename(filePath), __dirname: dirname(filePath) });
  return new Script(src, buildedOptions);
};

const readDir = async (dir, options = {}) => {
  const files = await readdir(dir, { withFileTypes: true });
  const scripts = {};

  for (const file of files) {
    if (file.isFile() && !file.name.endsWith('js')) continue;
    const filePath = join(dir, file.name);
    const loader = file.isFile() ? readScript : readDir;
    scripts[basename(file.name, extname(file.name))] = await loader(filePath, options);
  }

  return scripts;
};

module.exports = { Script, readScript, readDir, createContext, createScript, COMMON_CONTEXT };
