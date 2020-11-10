/* eslint-disable @typescript-eslint/prefer-for-of */
import * as vscode from 'vscode'
import { parse, File } from 'sucrase/dist/parser'
import { performance } from 'perf_hooks'

export interface DirlistT {
  name: string
  path: string
  folders: string[]
  options: string[]
}

type TryParse =
  | {
      tokens: File['tokens']
      code: string
      range: vscode.Range
    }
  | undefined

export interface ImportParsed {
  type: 'import' | 'require' | null
  path: string | null
  range: vscode.Range
}

export type NoUndefinedField<T> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>
}

function tryParse(
  startPosition: vscode.Position,
  endPosition: vscode.Position,
  document: vscode.TextDocument,
  timer: number
): TryParse {
  const range = new vscode.Range(startPosition, endPosition)
  const code = document.getText(range)
  const stopRecursion = performance.now() - timer >= 3

  // We don't want parsing taking longer than 3ms
  if (stopRecursion) {
    return undefined
  }

  try {
    const { tokens } = parse(code, false, true, false)

    return {
      tokens,
      code,
      range
    }
  } catch (err) {
    const newStartPosition = startPosition.line - 1

    if (newStartPosition >= 0) {
      return tryParse(
        new vscode.Position(startPosition.line - 1, 0),
        endPosition,
        document,
        timer
      )
    }

    return undefined
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
  const parsedCode = tryParse(
    importLine.range.start,
    importLine.range.end,
    document,
    performance.now()
  )

  if (parsedCode) {
    const { tokens, range, code } = parsedCode

    const importParsed: ImportParsed = {
      path: null,
      type: null,
      range
    }

    let notDone = true
    let passedEOF = false
    while (notDone) {
      const currentToken = tokens.pop()!
      const currentTokenString = code.slice(
        currentToken.start,
        currentToken.end
      )

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
}
