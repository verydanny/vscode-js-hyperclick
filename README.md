# Smart Goto

VSCode extension that attempts to deduce aliased module paths.

[How To Use](readme/example1.gif)

## Usage

1. Install plugin
2. CMD/CTRL + Click, F12, or right click -> Go To Definition on import paths
3. **(optional performance boost):** In vscode settings, Editor > Goto Location: Multiple Definitions > goto. This will open the winning result first. It the settings.json, it's `"editor.gotoLocation.multipleDefinitions": "goto"`.

## Settings

- `smart-goto.resolveExtensions: string[]` - String array of the extensions you don't have to add the extension to. I recommend to not do things like `.css`, `.scss`. You really only want to resolve `.js`, `.jsx`, etc.

-  `smart-goto.ignoreFolders: string[]` - String array of folders to to parse when creating internal dependency search stream. Default is `node_modules` and `.git`.

## Information
Sometimes aliases are defined in webpack, Typescript settings, or babel to avoid relative imports. I got tired of having to copy/paste the paths and type it into vscode's fuzzy search for certain projects I was working on.

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
- **Finds and opens files when extension provided**
- **Faster than tsserver in most cases**
- **Coming Soon**:
  - Automatic `baseDir` inference based on `tsconfig.json`
  - Automatic `baseDir` inference based on `package.json` having a `moduleRoots` property

## In Development

1. Right now, I don't support weird aliases like `@components`. I plan on adding support for that soon.
2. Use of `jsconfig.json` and `tsconfig.json`. If you have paths/basePaths configured there, it'll work for all JS/TS
3. Support for more extensions
4. Custom config for aliasing in `.vscode/settings.json` config:

```json
{
  "smart-goto.paths": {
    "@components": "src/components"
  }
}
```

This will speed up resolution/linking by a massive amount.