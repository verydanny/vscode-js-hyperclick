/* eslint-disable @typescript-eslint/prefer-includes */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/prefer-for-of */
import { parse as parsePath, ParsedPath, resolve } from 'path'

import { parse } from 'sucrase/dist/parser'
import * as vscode from 'vscode'

import { GroupExtended, StorageBinData } from './workspace'

interface ImportType {
  type: 'import' | 'require' | null
  path: string | null
  range: vscode.Range | null
}

type Match = {
  file: boolean | ParsedPath
  term: string | null
} & Partial<GroupExtended>

export class Provider {
  context: vscode.ExtensionContext
  documentUri?: vscode.Uri
  workspaceName?: string
  directoryLayout?: Array<import('./workspace').StorageBinData>
  cacheList: Map<string, vscode.Location>

  range = new vscode.Range(0, 0, 0, 0)

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.cacheList = new Map()
  }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    const URI = document.uri
    const currentFolder = vscode.Uri.joinPath(URI, '../')
    const importLine = document.lineAt(position)
    const workspaceName = vscode.workspace.getWorkspaceFolder(URI)
    const directoryLayout: StorageBinData | undefined = workspaceName?.name
      ? this.context.workspaceState.get(workspaceName.name)
      : undefined
    const cachedLocation = this.cacheList.get(importLine.text)

    if (cachedLocation) {
      return cachedLocation
    }

    try {
      const { tokens } = parse(importLine.text, true, true, false)

      enum TokenType {
        name = 2560,
        import = 44048,
        string = 2048,
        eof = 3072,
      }

      const importNormalized: ImportType = {
        type: null,
        path: null,
        range: null,
      }

      const range = tokens.filter(({ start, end, type }) => {
        const slicedString = importLine.text.slice(start, end)

        if (TokenType[type] === 'name' && slicedString === 'require') {
          importNormalized.type = 'require'

          return true
        }

        if (TokenType[type] === 'import' && slicedString === 'import') {
          importNormalized.type = 'import'

          return true
        }

        if (TokenType[type] === 'string') {
          importNormalized.path = importLine.text.slice(start + 1, end - 1)
          importNormalized.range = new vscode.Range(
            new vscode.Position(importLine.lineNumber, start + 1),
            new vscode.Position(importLine.lineNumber, end + 1)
          )

          return true
        }

        if (TokenType[type] === 'eof') {
          return true
        }

        return false
      })

      if (range.length >= 4) {
        return undefined
      }

      if (
        importNormalized.path &&
        importNormalized.range &&
        importNormalized.type &&
        directoryLayout
      ) {
        const worstCaseRegex = new RegExp(importNormalized.path)
        let match: Match = {
          file: false,
          term: null,
        }

        for (let i = 0; i < directoryLayout.length; i++) {
          const folderSearchTerms = directoryLayout[i][0]
          const fileSearchTerms = directoryLayout[i][1]
          const fileInfo = directoryLayout[i][2]

          for (let ti = 0; ti < folderSearchTerms.length; ti++) {
            const term = folderSearchTerms[ti]

            if (term === importNormalized.path) {
              match = {
                ...match,
                ...fileInfo,
                term,
              }

              break
            }
          }

          for (let fi = 0; fi < fileSearchTerms.length; fi++) {
            const fileTerm = fileSearchTerms[fi]
            const fileInformation = fileSearchTerms[fi + 1]

            if (typeof fileInformation === 'object') {
              if (
                typeof fileTerm === 'string' &&
                fileTerm === importNormalized.path
              ) {
                if (typeof fileInformation === 'object') {
                  match = {
                    ...fileInfo,
                    term: null,
                    file: fileInformation,
                  }
                }

                break
              }

              if (typeof fileTerm === 'string' && worstCaseRegex.test(fileTerm)) {
                match = {
                  ...fileInfo,
                  term: null,
                  file: fileInformation
                }
              }
            }
          }
        }

        // If it's an index file
        if (typeof match.file === 'object' && match.fullPath) {
          const query = vscode.Uri.joinPath(
            vscode.Uri.parse(match.fullPath),
            match.file.base
          )
          const Location = new vscode.Location(query, this.range)

          this.cacheList.set(importLine.text, Location)

          return Location
        }

        if (
          !match.file &&
          match.hasIndex &&
          match.fullPath &&
          match.indexValues
        ) {
          const query = vscode.Uri.joinPath(
            vscode.Uri.parse(match.fullPath),
            match.indexValues.join('')
          )

          const Location = new vscode.Location(query, this.range)

          this.cacheList.set(importLine.text, Location)

          return Location
        }

        if (!match.file && !match.term) {
          const parsedWeird = parsePath(importNormalized.path)

          if (parsedWeird.ext && /^.*/.test(parsedWeird.dir)) {
            const query = vscode.Uri.joinPath(
              currentFolder,
              importNormalized.path
            )

            const Location = new vscode.Location(query, this.range)

            this.cacheList.set(importLine.text, Location)

            return Location
          }
        }
      }

      return undefined
    } catch {
      // Silent Fail
    }

    return undefined
  }
}
