# Smart Goto

[How To Use](readme/example1.gif)

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

### `smart-goto.ignoreFolders`: `String[]` `(Default: ['node_modules', '.git'])` - List of folders to not index. By default vscode is pretty good at locating node_module stuff.

### `smart-goto.extensions`: `String[]` `(Default: ['ts', 'tsx', 'js', 'jsx'])` - List of file extensions you want this extension to work in.
