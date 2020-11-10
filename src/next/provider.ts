import { performance } from 'perf_hooks'

import * as picomatch from 'picomatch'
import * as vscode from 'vscode'

import {
  getParsedImport,
  NoUndefinedField,
  ImportParsed
} from './utils/langParser'
import { AliasParseResult } from './utils/tsconfig'

type Config = [string, AliasParseResult]
type ConfigArray = Config[]

interface MatchedConfig {
  type: 'relative' | 'alias'
  alias?: string
  match?: Config
  test?: {
    isMatch: boolean
    match: boolean
    output: any
  }
}

export class SmartGoToProvider implements vscode.DefinitionProvider {
  context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  getConfigForDefinition(
    parsedLine: NoUndefinedField<ImportParsed>,
    configs: ConfigArray
  ): MatchedConfig | undefined {
    const splitParsedLineAlias = parsedLine.path.split('/')[0]
    const relativeDir = picomatch('\\.\\/**')
    const relativeCurrentDir = picomatch('\\.\\.\\/**')

    if (relativeDir(parsedLine.path) || relativeCurrentDir(parsedLine.path)) {
      return {
        type: 'relative'
      }
    }

    for (let i = 0; i < configs.length; i++) {
      const match = configs[i]
      const alias = configs[i][0]

      const aliasGlob = `${alias}!(${splitParsedLineAlias})**`
      const picoRe = picomatch.makeRe(aliasGlob, { capture: true }, false, true)
      const picomatchTest = picomatch.test(parsedLine.path, picoRe)

      console.log('Testing...', alias)

      if (picomatchTest.isMatch) {
        return {
          type: 'alias',
          test: picomatchTest,
          alias: splitParsedLineAlias,
          match
        }
      }
    }
  }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    // perf metrics
    const startDefinitionProvider = performance.now()

    const URI = document.uri
    const importLine = document.lineAt(position)
    const aliasConfigs = this.context.workspaceState.get('aliasConfig') as
      | ConfigArray
      | undefined
    const parsedLine = getParsedImport(importLine, document)

    // perf metrics
    const doneDefinitionProvider = performance.now()
    console.log(
      'doneDefinitionProvider',
      doneDefinitionProvider - startDefinitionProvider
    )

    if (parsedLine && aliasConfigs) {
      const configForDefinition = this.getConfigForDefinition(
        parsedLine,
        aliasConfigs
      )

      console.log('configForDefinition', configForDefinition)
    }

    return null
  }
}
