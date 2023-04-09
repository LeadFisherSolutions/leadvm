const USE_STRICT = `'use strict';\n`;
const SRC_BEFORE = '((exports, require, module, __filename, __dirname) => { ';
const SRC_AFTER = '\n});';

const useStrict = src => (src.startsWith(USE_STRICT) ? '' : USE_STRICT);
const addExt = (name, ext) => (name.toLocaleLowerCase().endsWith(`.${ext}`) ? name : `${name}.${ext}`);
const wrapSource = src => SRC_BEFORE + src + SRC_AFTER;

module.exports = {
  useStrict,
  addExt,
  wrapSource,
};
