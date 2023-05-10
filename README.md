# [Node js] Leadfisher script loader with vm wrapper

## Create script from string

Script contains object expression. You can use it for configs, network packets,
serialization format, etc.

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

Script contains function expression. You can use it for api endpoints, domain
logic stored in files or database, etc.

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

## Read script from file

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

## Read scripts from folder

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
//      arrow: {
//        script: Script {},
//        context: {},
//        access: {},
//        type: 'cjs',
//        __dirname: '/home/user/app/test/examples',
//        __filename: 'arrow.js',
//        exports: { field: 'value', add: [Function: add], sub: [Function: sub] }
//      }
//   }
```

## Require access

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

## Replace Required lib interface

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

## Experimental

### npm packages under VM

Usage: Options.npmVm = true

<div style="display:inline-flex; gap: 20px; justify-content: center; width:100%;">
  <pre style="zoom:0.1;background:transparent !important;">
        █████ █                              ██        █████ ██                      █
    ██████  █                                ██    ██████  ████ █  █              ██
    ██   █  █                                 ██   ██   █  █  ███  ███             ██
  █    █  █                                  ██  █    █  █    █    █              ██
      █  █                                   ██      █  █                  ████   ██                ███  ████
      ██ ██             ███      ████     ███ ██     ██ ██        ███      █ ████ ███  ███     ███    ████ ████ █
      ██ ██            █ ███    █ ███  █ █████████   ██ ██         ███    ██  ████ ██ █ ███   █ ███    ██   ████
      ██ ██           █   ███  █   ████ ██   ████    ██ ██████      ██   ████      ███   ███ █   ███   ██
      ██ ██          ██    █████    ██  ██    ██     ██ █████       ██     ███     ██     ████    ███  ██
      ██ ██          ████████ ██    ██  ██    ██     ██ ██          ██       ███   ██     ██████████   ██
      █  ██          ███████  ██    ██  ██    ██     █  ██          ██         ███ ██     █████████    ██
        █           ██       ██    ██  ██    ██        █           ██    ████  ██ ██     ████         ██
    ████           █████    ███    ██  ██    ██    █████           ██   █ ████ █  ██     ██████    █  ███
    █  █████████████  ███████  █████ ██  █████     █  █████         ███ █   ████   ██     ██ ███████    ███
  █     █████████     █████    ███   ██  ███     █    ███           ███            ██    ██  █████
  █                                              █                                       █
    █                                              █                                     █
    ██                                             █                                   █
                                                    ██                                █
  </pre>
  <pre style="zoom:0.1;background:transparent !important;">
        █████ █                              ██        █████ █      ██       █████   ██    ██
    ██████  █                                ██    ██████  █    █████    ██████  █████ █████
    ██   █  █                                 ██   ██   █  █       █████ ██   █  █  █████ █████
  █    █  █                                  ██  █    █  ██       █ ██ █    █  █   █ ██  █ ██
      █  █                                   ██      █  ███      █   █     █  █    █     █
      ██ ██             ███      ████     ███ ██     ██   ██      █        ██ ██    █     █
      ██ ██            █ ███    █ ███  █ █████████   ██   ██      █        ██ ██    █     █
      ██ ██           █   ███  █   ████ ██   ████    ██   ██     █         ██ ██    █     █
      ██ ██          ██    █████    ██  ██    ██     ██   ██     █         ██ ██    █     █
      ██ ██          ████████ ██    ██  ██    ██     ██   ██     █         ██ ██    █     ██
      █  ██          ███████  ██    ██  ██    ██      ██  ██    █          █  ██    █     ██
        █           ██       ██    ██  ██    ██       ██ █     █             █     █      ██
    ████           █████    ███    ██  ██    ██        ███     █         ████      █      ██
    █  █████████████  ███████  █████ ██  █████           ███████         █  █████           ██
  █     █████████     █████    ███   ██  ███              ███          █     ██
  █                                                                    █
    █                                                                    █
    ██                                                                   ██

  </pre>
</div>
