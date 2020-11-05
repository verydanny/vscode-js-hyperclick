# Change Log

All notable changes to the "smart-goto" extension will be documented in this file.

## [0.9.0]

- Small optimization that if there's only 1 workplace open, no need to create a loop.

## [0.8.0]

- Added `smart-goto.resolveExtensions: string[]` option. These are the extensions you don't have to add the extension to. I recommend
to not do things like `.css`, `.scss`. You really only want to resolve `.js`, `.jsx`, etc.

- Added `smart-goto.ignoreFolders` option. An array of folders to to parse when creating internal dependency search stream. Default is `node_modules` and `.git`.
