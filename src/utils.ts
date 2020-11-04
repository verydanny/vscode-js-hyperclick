/* eslint-disable @typescript-eslint/prefer-for-of */
import { join, parse as pathParse } from 'path'

import * as vscode from 'vscode'
import { parse, File } from 'sucrase/dist/parser'

export interface DirlistT {
  name: string
  path: string
  folders: string[]
  options: string[]
}

interface TryParse {
  tokens: File['tokens']
  code: string
  range: vscode.Range
}

interface ImportParsed {
  type: 'import' | 'require' | null
  path: string | null
  range: vscode.Range
}

type NoUndefinedField<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>
}

/**
 * This can be an option in the extension
 */
// Might be too many
export const possibleExtensions = ['js', 'jsx', 'ts', 'tsx']

export const createAliasListForThisDir = (folderSections: string[]) => {
  const result = []

  while (folderSections.length) {
    const current = folderSections.shift()

    if (current) {
      result.push(join(current, folderSections.join('/')))
    }
  }

  return result
}

export const createFileAliasListForAliases = (
  folderSections: string[],
  filesArray: string[]
) => {
  const result = []

  for (let i = 0; i < folderSections.length; i++) {
    const currentFolder = folderSections[i]

    for (let fi = 0; fi < filesArray.length; fi++) {
      const currentFile = pathParse(filesArray[fi])

      result.push(
        `${currentFolder}/${currentFile.name}`,
        currentFile,
        `${currentFolder}/${currentFile.base}`,
        currentFile
      )
    }
  }

  return result
}

function tryParse(
  startPosition: vscode.Position,
  endPosition: vscode.Position,
  document: vscode.TextDocument
): TryParse {
  const range = new vscode.Range(startPosition, endPosition)
  const code = document.getText(range)

  try {
    const { tokens } = parse(code, true, true, false)

    return {
      tokens,
      code,
      range,
    }
  } catch {
    return tryParse(
      new vscode.Position(startPosition.line - 1, 0),
      endPosition,
      document
    )
  }
}

const STRING_TYPE = 2048
const EOF_TYPE = 3072
const IMPORT_TYPE = 44048
const NAME_TYPE = 2560

export function getParsedImport(
  importLine: vscode.TextLine,
  document: vscode.TextDocument
): NoUndefinedField<ImportParsed> | undefined {
  const { tokens, code, range } = tryParse(
    importLine.range.start,
    importLine.range.end,
    document
  )

  const importParsed: ImportParsed = {
    path: null,
    type: null,
    range,
  }

  let notDone = true
  let passedEOF = false
  while (notDone) {
    const currentToken = tokens.pop()!
    const currentTokenString = code.slice(currentToken.start, currentToken.end)

    if (currentToken.type === EOF_TYPE) {
      passedEOF = true
    }

    if (passedEOF && currentToken.type === STRING_TYPE) {
      importParsed.path = code.slice(
        currentToken.start + 1,
        currentToken.end - 1
      )
    }

    if (currentToken.type === IMPORT_TYPE) {
      notDone = false
      importParsed.type = 'import'
    }

    if (currentToken.type === NAME_TYPE && currentTokenString === 'require') {
      notDone = false
      importParsed.type = 'require'
    }

    if (!tokens.length) {
      notDone = false
    }
  }

  if (importParsed.path && importParsed.type) {
    return importParsed as NoUndefinedField<typeof importParsed>
  }
}
