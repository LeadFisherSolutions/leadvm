import { Context, Script, ScriptOptions, BaseOptions } from 'node:vm';

export const COMMON_CONTEXT: Context;
export const MODULE_TYPES: ModuleTypes;

export function createContext(context?: Context, preventEscape?: boolean): Context;

//* { ${src} \n} / (exports,require,module,__filename,__dirname) => { ${src} \n}
declare enum ModuleType {
  DEFAULT = 'default',
  COMMONJS = 'commonjs',
}

export interface VMScriptOptions extends ScriptOptions {
  type?: ModuleType; //* Тип скрипта (cjs / js)
  dirname?: string; //* Папка скрипта
  relative?: string; //* Относительный путь
  context?: Context; //* Контекст с внешним API
  access?: object; //* Доступ к внешним файлам
}

export class Script {
  constructor(name: string, src: string, options?: VMScriptOptions);
  name: string; //* Имя скрипта
  script: Script; //* Сгенерированный скрипт vm.createScript(src)
  context: Context; //* Сгенерированный контекст vm.createContext(context)
  exports: any; //* Результат выполнения скрипта
}

export function createScript(name: string, src: string, options?: VMScriptOptions): Script;
export function readScript(filePath: string, options?: BaseOptions): Promise<Script>;
export function readDir(filePath: string, options?: BaseOptions): Promise<Script[]>;
