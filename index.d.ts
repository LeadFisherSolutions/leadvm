import { Context, Script, ScriptOptions, BaseOptions, RunningCodeOptions } from 'node:vm';
type MODULE_TYPE = 'cjs' | 'js';
type TOptions<value> = { [key: string]: value };

export const COMMON_CTX: Context;
export const MODULE_TYPES: MODULE_TYPE[];

export interface VMScriptOptions extends BaseOptions {
  dir?: string;
  filename?: string;
  type?: MODULE_TYPE;
  access?: TOptions<boolean | object>;
  ctx?: Context;
  run?: RunningCodeOptions;
  script?: ScriptOptions;
  npmIsolation?: boolean;
}

export function createContext(context?: Context | Object, preventEscape?: boolean): Context;
export function execute(src: string, options?: VMScriptOptions): Script;
export function readScript(path: string, options?: VMScriptOptions): Promise<Script>;
export function readDir(path: string, options?: VMScriptOptions, deep?: boolean): Promise<Script[]>;
