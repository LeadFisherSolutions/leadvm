<h1 align="center">Script isolation and loader</h1>

<h2 align="center">Installation</h2>

```bash
npm i leadvm --save
```

<h2 align="center">Usage</h2>

- **Create script from string**
  You can use it for configs, network packets, serialization format, etc. Function expression can be used as api endpoint, domain logic, etc. But you also can use any type of javascript expression inside the script

```js
const leadvm = require('leadvm');
const ms = leadvm.createScript(`({ field: 'value' });`, {}, 'Example');
// const ms = leadvm.createScript(`(a, b) => a + b;`);
console.log(ms);
// Output:
//   Script {
//     script: Script {},
//     context: {},
//     access: {}
//     type: 'js',
//     __dirname: '/home/user/app',
//     __name: 'Example',
//     exports: { field: 'value' }
//   }
```

- **Read scripts from file**
  You can read exact script from file. It will help you with code decomposition.

```js
const leadvm = require('leadvm');
(async () => {
  const ms = await leadvm.readScript('./test/examples/simple.js');
  console.log(ms);
})();
// Output:
//   Script {
//     script: Script {},
//     context: {},
//     access: {},
//     type: 'js',
//     __dirname: '/home/user/app/test/examples',
//     __name: 'simple.js',
//     exports: { field: 'value', add: [Function: add], sub: [Function: sub] }
//   }
```

- **Read scripts from folder**
  Folder reading may be useful for api modules loading. By default it loads nested directories scripts too, you can change it by providing third parameter as false.

```js
const leadvm = require('leadvm');
(async () => {
  const ms = await leadvm.readDir('./test/examples/readDir');
  console.log(ms);
})();
// Output:
//   {
//      simple: {
//        script: Script {},
//        context: {},
//        access: {},
//        type: 'js',
//        __dirname: '/home/user/app/test/examples',
//        __filename: 'simple.js',
//        exports: { field: 'value', add: [Function: add], sub: [Function: sub] }
//      },
//      deep: {
//        arrow: {
//          script: Script {},
//          context: {},
//          access: {},
//          type: 'cjs',
//          __dirname: '/home/user/app/test/examples',
//          __filename: 'arrow.js',
//          exports: { field: 'value', add: [Function: add], sub: [Function: sub] }
//        }
//      }
//   }
```

- **Nested modules scripts**
  By default nested modules can't be required, to require them you must add access field in options:

```js
const leadvm = require('leadvm');
(async () => {
  const sandbox = { console };
  sandbox.global = sandbox;
  const ms = await leadvm.createScript(`module.exports = require('./examples/module.cjs');`, {
    type: 'cjs',
    __dirname,
    context: leadvm.createContext(Object.freeze(sandbox)),
    access: {
      // You can also use path to dir
      // [path.join(__dirname, 'examples']: true
      // NOTICE: Use it only with boolean value
      [path.join(__dirname, 'examples', 'module.cjs')]: true,
      [path.join(__dirname, 'examples', 'module.nested.js')]: true,
    },
  });
  console.log(ms);
})();
// Output:
//    Script {
//      script: Script {},
//      context: { console },
//      access: {
//        '/home/user/app/test/examples/module.cjs': true,
//        '/home/user/app/test/examples/module.nested.js': true
//      },
//      type: 'cjs',
//      __dirname: '/home/user/app/tests',
//      __filename: 'module.cjs',
//      exports: { name: 'module', value: 1, nested: { name: 'module.nested', value: 2 } }
//    }
```

- **Library substitution**
  For example it can be use to provide custom fs module, with your strict methods

```js
const leadvm = require('leadvm');
(async () => {
  const src = `
    const fs = require('fs');
    module.exports = {
      async useStub() {
        return new Promise((resolve) => {
          fs.readFile('name', (err,data) => {resolve(data);});
        });
      }
    };
  `;
  const ms = leadvm.createScript(src, {
    access: {
      fs: {
        readFile(filename, callback) {
          callback(null, 'stub-content');
        },
      },
    },
    type: 'cjs',
  });
  const res = await ms.exports.useStub();
  console.log(res);
})();
// Output: stub-content
```

- **Class script types**
  - **type**:
    <code>_js_</code> Script execution returns last expression
    <code>_cjs_</code> Script execution returns all that module.exports includes
  - **\_\_filename** Stands for the name of the module, by default <code>N404.js</code>
  - **\_\_dirname** Stands for the name of the module directory, by default <code>process.cwd()</code>
  - **npmIsolation** Use it if you want to isolate your npm modules in vm context.
  - **context** Script execution closured context, by default its clear that is why you can't use even <code>setTimeout</code> or <code>setInterval</code>.
  - **access** Contains _absolute paths_ to nested modules or name of _npm/origin_ libraries as keys, with stub-content or boolean values, _by default_ you can't require nested modules.

```ts
import { Context, Script, ScriptOptions, RunningCodeOptions, BaseOptions } from 'node:vm';

type MODULE_TYPE = 'js' | 'cjs';
type TOptions<value> = { [key: string]: value };

interface VMScriptOptions extends BaseOptions {
  __dirname?: string;
  __filename?: string;
  type?: MODULE_TYPE;
  access?: TOptions<boolean | object>;
  context?: Context;
  npmIsolation?: boolean;
  runOptions?: RunningCodeOptions;
  scriptOptions?: ScriptOptions;
}

class Script {
  constructor(src: string, options?: VMScriptOptions);
  __filename: string;
  __dirname: string;
  type: MODULE_TYPE;
  access: TOptions<boolean | object>;
  script: Script;
  context: Context;
  exports: any;
}
```

<h2 align="center">Copyright & contributors</h2>

<p align="center">
Copyright © 2023 <a href="https://github.com/LeadFisherSolutions/leadvm/graphs/contributors">Leadfisher contributors</a>.
Leadvm is <a href="./LICENSE">MIT licensed license</a>.<br/>
Leadvm is one of <a href="https://github.com/LeadFisherSolutions">leadfisher solutions</a>.
</p>
