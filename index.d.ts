import { Context, Script, ScriptOptions, BaseOptions, RunningCodeOptions } from 'node:vm';
type MODULE_TYPE = 'cjs' | 'js';
type TOptions<value> = { [key: string]: value };

export const COMMON_CTX: Context;
export const MODULE_TYPES: MODULE_TYPE[];

export interface VMScriptOptions extends BaseOptions {
  __dirname?: string;
  __filename?: string;
  type?: MODULE_TYPE;
  access?: TOptions<boolean | object>;
  context?: Context;
  runOptions?: RunningCodeOptions;
  scriptOptions?: ScriptOptions;
  npmIsolation?: boolean;
}

export class Script {
  constructor(src: string, options?: VMScriptOptions);
  __filename: string;
  __dirname: string;
  type: MODULE_TYPE;
  access: TOptions<boolean | object>;
  script: Script;
  context: Context;
  exports: any;
}

export function createContext(context?: Context | Object, preventEscape?: boolean): Context;
export function createScript(src: string, options?: VMScriptOptions): Script;
export function readScript(filePath: string, options?: VMScriptOptions): Promise<Script>;
export function readDir(filePath: string, options?: VMScriptOptions, deep?: boolean): Promise<Script[]>;
