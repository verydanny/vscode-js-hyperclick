import * as vscode from 'vscode'
import {
  join,
  parse as parsePath
} from 'path'

import {
  isDirectory,
  findFile,
  extractImportPathFromTextLine
} from './utils'

interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export class Provider {
  context: vscode.ExtensionContext
  documentUri?: vscode.Uri
  workspaceName?: string
  directoryLayout?: import('./utils').DirlistT[]
  cacheUri: {
    code: string,
    uri?: vscode.Location
  }
  range = new vscode.Range(0,0,0,0)

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.cacheUri = {
      code: ''
    }
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const Uri = document.uri
    const workspaceName = vscode.workspace.getWorkspaceFolder(Uri)

    if (workspaceName) {
      this.workspaceName = workspaceName.name
      this.directoryLayout = this.context.workspaceState.get(
        this.workspaceName
      )

      const importLine = document.lineAt(position)
      const importUrl = extractImportPathFromTextLine(
        importLine
      )

      if (
        importUrl
        && this.cacheUri.code === importLine.text
      ) {
        return this.cacheUri.uri
      }
      
      if (importUrl) {
        this.cacheUri = {
          code: importLine.text
        }

        this.buildPath(importUrl)
      }
    }
    return undefined
  }

  buildPath(
    ImportPath: { path: string, range: vscode.Range }
  ) {
    const { path, range } = ImportPath
    const parsedImportPath = parsePath(path)
    const { dir } = parsedImportPath

    if (this.directoryLayout) {
      for (
        const directory of this.directoryLayout
      ) {
        for (const directoryQueryOption of directory.options) {
          if (dir === directoryQueryOption) {
            return this.testForFileValidity(
              directory,
              parsedImportPath,
              range
            )
          }
        }
      }
    }

    return undefined
  }

  testForFileValidity(
    directory: import('./utils').DirlistT,
    dir: ParsedPath,
    range: vscode.Range
  ) {
    const checkIfThisIsDir = join(directory.path, dir.base)
    
    if (
      isDirectory(checkIfThisIsDir)
    ) {
      const getTheUriWithIndex = findFile(checkIfThisIsDir, 'index')

      if (getTheUriWithIndex) {
        const uri = vscode.Uri.file(getTheUriWithIndex)
        const location = new vscode.Location(uri, range ? range : this.range)

        this.cacheUri = {
          ...this.cacheUri,
          uri: location,
        }

        return location
      }
    } else {
      const getTheFileUri = findFile(directory.path, dir.base)

      if (getTheFileUri) {
        const uri = vscode.Uri.file(getTheFileUri)
        const location = new vscode.Location(uri, range ? range : this.range)

        this.cacheUri = {
          ...this.cacheUri,
          uri: location,
        }
        
        return location
      }
    }
  }
}
