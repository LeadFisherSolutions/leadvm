# Leadfisher script loader, node.js vm wrapper

## Create script from string

Script contains object expression. You can use it for configs, network packets,
serialization format, etc.

```js
const leadvm = require('leadvm');
const src = `({ field: 'value' });`;
const ms = leadvm.createScript('Example', src);
console.log(ms);
// Output:
//   Script {
//     name: 'Example',
//     script: Script {},
//     context: {},
//     exports: { field: 'value' }
//   }
```

Script contains function expression. You can use it for api endpoints, domain
logic stored in files or database, etc.

```js
const leadvm = require('leadvm');
const src = `(a, b) => a + b;`;
const ms = leadvm.createScript('Example', src);
console.log(ms);
// Output:
//   Script {
//     name: 'Example',
//     script: Script {},
//     context: {},
//     exports: [Function]
//   }
```

## Read script from file

```js
const leadvm = require('.');
(async () => {
  const ms = await leadvm.readScript('./test/examples/simple.js');
  console.log(ms);
})();
// Output:
//   Script {
//     name: 'simple',
//     script: Script {},
//     context: {},
//     exports: { field: 'value', add: [Function: add], sub: [Function: sub] }
//   }
```
