# js-hyperclick

[How To Use](readme/example1.gif)

### **WIP - This is a work in progress**

VSCode extension that attempts to deduce aliased module paths. Sometimes aliases are defined in webpack, Typescript settings, or
babel to avoid relative imports. I will not argue if this is right or wrong (it's wrong), but I got tired of having to copy/paste the paths and type it into vscode's fuzzy search for certain projects I was working on.

If you’re not familiar with the concept of aliasing, it turns a file like this:

```js
import React from 'react'
import { connect } from 'react-redux'
import { someConstant } from './../../config/constants'
import MyComponent from './../../../components/MyComponent'
```

Into this:

```js
import React from 'react'
import { connect } from 'react-redux'
import { someConstant } from 'config/constants'
import MyComponent from 'components/MyComponent'
```

## Features

- **Automatic aliases deduction**  
`apps/components/core -> /Users/example/source/app-name/src/apps/components/core/index.js`
- **Finds and locates `index` files**
- **Pretty fast**  
  - I haven't tested massive projects, but it takes about 90ms to boot up for a project with 1200 directories
- **Coming Soon**:
  - Automatic `baseDir` inference based on `tsconfig.json`
  - Automatic `baseDir` inference based on `package.json` having a `moduleRoots` property


## Requirements

If you have a mixed TypeScript/JavaScript folder structure, you might suffer performance issues because TypeScrip still attempts to configure the JS files under the `tsconfig.json` file. 

Use the following `tsconfig.json` settings to help this out. After initial TS "boot up", it should be fine.

```js
{
  ...,
  allowJs: true,
  checkJs: true,
  ...
}
```

## Extension Settings

**SOON**

**`jsHyperclick.supportedFiletypes`**: **`string[]`** - An array of extensions js-hyperclick will attempt to resolve. More extensions means longer resolution. Try not to go overboard here.  
>example: `['js', 'vue', 'jsx']`  

<br/>

**`jsHyperclick.tsConfigLocation`** : **`string[]`** - Path of tsConfig (only if it's not at root)

## Known Issues

In a TypeScript/JavaScript mixed project, when one opens a JS file it attempts to build a configuration. This configuration can slow. It sometimes re-runs the configuration on a new JS file. TSServer is a mess. 

A solution is to `allowJs` and `checkJs` in the tsconfig.json file.

## Release Notes

0.0.2 - Fix RegExp Bug
0.0.1 - Just trying to get it on the market

### 1.0.0

Initial release of jsHyperclick