'use strict';

const { createContext } = require('node:vm');
const { MODULE_TYPES, CTX_OPTS, EMPTY_CTX } = require('./config');

const scriptType = name => {
  if (!name?.includes('.')) return MODULE_TYPES[0];
  const type = name.split('.').at(-1);
  return MODULE_TYPES.includes(type) ? type : MODULE_TYPES[0];
};

const createCtx = (ctx, mode = false) =>
  ctx ? createContext(ctx, { ...CTX_OPTS, preventEscape: mode ? 'afterEvaluate' : '' }) : EMPTY_CTX;

module.exports = { createCtx, scriptType };
