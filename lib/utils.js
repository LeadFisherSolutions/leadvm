'use strict';

const vm = require('node:vm');
const { MODULE_TYPES, CTX_OPTS, EMPTY_CTX, WRAPPERS } = require('./config');

const scriptType = name => {
  if (!name?.includes('.')) return MODULE_TYPES[0];
  const type = name.split('.').at(-1);
  return MODULE_TYPES.includes(type) ? type : MODULE_TYPES[0];
};

const createContext = (ctx, mode = false) =>
  ctx ? vm.createContext(ctx, { ...CTX_OPTS, preventEscape: mode ? 'afterEvaluate' : '' }) : EMPTY_CTX;

const wrapSource = (src, ext = 'js') => `'use strict';\n${WRAPPERS[ext](src.replace(/'use strict';\n?/, ''))}`;
module.exports = { wrapSource, createContext, scriptType };
