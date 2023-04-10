const USE_STRICT = `'use strict';\n`;

const useStrict = src => (src.startsWith(USE_STRICT) ? '' : USE_STRICT);
const addExt = (name, ext) => (name.toLocaleLowerCase().endsWith(`.${ext}`) ? name : `${name}.${ext}`);
const wrapSource = src => `((exports, require, module, __filename, __dirname) => { ${src}\n});`;

module.exports = {
  useStrict,
  addExt,
  wrapSource,
};
