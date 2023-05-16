<h1 align="center"> Script isolation and loader</h1>

<h2 align="center">Installation</h2>

```bash
npm i leadvm --save
```

<h2 align="center">Usage</h2>

<h2 align="center">Create script from string</h2>

<p align="center">
Script contains object expression. You can use it for configs, network packets,
serialization format, etc.
</p>

```js
const leadvm = require('leadvm');
const ms = leadvm.createScript(`({ field: 'value' });`, {}, 'Example');
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

<p align="center">
Script contains function expression. You can use it for api endpoints, domain
logic stored in files or database, etc.
</p>

```js
const leadvm = require('leadvm');
const ms = leadvm.createScript(`(a, b) => a + b;`);
console.log(ms);
// Output:
//   Script {
//     script: Script {},
//     context: {},
//     access: {},
//     type: 'js',
//     __dirname: '/home/user/app',
//     __name: 'LeadScript.js',
//     exports: [Function]
//   }
```

<h2 align="center">Read script from file</h2>

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

<h2 align="center">Read scripts from folder</h2>

<p align="center">
Folder reading may be useful for api modules loading.<br/>
By default it loads nested directories scripts too, you can change it by providing third parameter as false
</p>

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

<h2 align="center">Nested modules access</h2>

<p align="center">By default nested modules can't be required, to require them you should do:</p>

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

<h2 align="center">Replace Required lib interface</h2>

<p align="center">For example it can be use to provide custom fs module, with your strict methods</p>

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

<h2 align="center">Types</h2>

```ts
class Script {
  constructor(src: string, options?: VMScriptOptions);
  __filename: string; // script / file name
  __dirname: string; // relevant to script directory
  type: MODULE_TYPE; // js => returns last expression, cjs => return all that module.exports includes
  access: TOptions<boolean | object>; // Absolute paths to nested modules, or dependencies, require
  script: Script; // vm.createScript
  context: Context; // vm.createContext
  exports: any; // return value of runtime
}

interface VMScriptOptions {
  __dirname?: string; // File execution directory, default is process.cwd
  __filename?: string; // The name of the script, default is N404.js
  type?: MODULE_TYPE; // js => returns last expression, cjs => return all that module.exports includes
  access?: TOptions<boolean | object>; // Absolute paths to nested modules, or dependencies, require protection
  context?: Context; // Execution context, default is empty, no Intervals etc.
  npmIsolation?: boolean; // Use VM isolation for nested dependencies
  runOptions?: RunningCodeOptions;
  scriptOptions?: ScriptOptions;
}
```
