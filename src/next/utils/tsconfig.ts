import * as fs from 'fs'
import * as path from 'path'
import { performance } from 'perf_hooks'

import * as vscode from 'vscode'
import { CompilerOptions, MapLike } from 'typescript'
import * as JSONC from 'jsonc-parser'
import * as picomatch from 'picomatch'

interface TsConfig {
  compilerOptions: CompilerOptions
  include?: string[]
  exclude?: string[]
  extends?: string
}

interface ParsedConfig {
  parsedConfig: TsConfig | undefined
  didFindConfig: boolean
}

export interface AliasParseResult {
  pattern: vscode.RelativePattern
  scannedDirectoryGlob: ReturnType<typeof picomatch['scan']>
  scannedAliasGlob: ReturnType<typeof picomatch['scan']>
}

export type ConfigMap = Map<string, {}>

function tryGettingUTF8File(
  path: string,
  debugChannel: vscode.OutputChannel
): string | undefined {
  try {
    const file = fs.readFileSync(path, { encoding: 'utf-8' })

    if (file) {
      debugChannel.appendLine(`Successfully loaded: ${path}`)

      return file
    }
  } catch (err) {
    const error: NodeJS.ErrnoException = err

    if (error.errno === -2) {
      debugChannel.appendLine(`File not found: ${path}`)
    }
  }
}

function getConfigs(
  workspaceUri: vscode.Uri,
  debugChannel: vscode.OutputChannel
): ParsedConfig {
  const parsedConfig =
    tryGettingUTF8File(
      path.join(workspaceUri.fsPath, './tsconfig.json'),
      debugChannel
    ) ||
    tryGettingUTF8File(
      path.join(workspaceUri.fsPath, './jsconfig.json'),
      debugChannel
    )

  if (parsedConfig) {
    return {
      parsedConfig: JSONC.parse(parsedConfig),
      didFindConfig: Boolean(parsedConfig),
    }
  }

  return {
    parsedConfig: undefined,
    didFindConfig: false,
  }
}

interface ParseAlias {
  glob: string
  globString: string | undefined
  baseFolder: string
}

function parseAliasPaths(baseFolder: string, glob: string[]) {
  const result = []

  for (let i = 0; i < glob.length; i++) {
    result.push(path.join(baseFolder, glob[i]))
  }

  return result
}

function parsePredefinedAliases(
  config: undefined | TsConfig,
  workspaceFolder: vscode.WorkspaceFolder
): undefined | Array<ParseAlias> {
  const result = []

  if (config) {
    const {
      exclude,
      include,
      extends: extendConfig,
      compilerOptions: { paths = {}, baseUrl = '' },
    } = config || null

    const pathAliasKeys = Object.keys(paths)
    const baseFolder = path.join(workspaceFolder.uri.fsPath, baseUrl)

    for (let i = 0; i < pathAliasKeys.length; i++) {
      const glob = pathAliasKeys[i]
      const globString =
        (glob.endsWith('*') ||
        glob.startsWith('*')) && glob.split('*').join('')

      result.push({
        glob,
        globString: globString || undefined,
        baseFolder,
        baseFolderGlobs: parseAliasPaths(baseFolder, paths[glob])
      })
    }

    return result
  }

  return undefined
}

export function getPotentialConfigs(
  context: vscode.ExtensionContext,
  debugChannel: vscode.OutputChannel
) {
  // Perf metrics
  const timeStart = performance.now()
  const workspaces = vscode.workspace.workspaceFolders
  const configsInMemory = context.workspaceState.get('aliasConfig') as
    | ConfigMap
    | undefined

  // if (configsInMemory) {
  //   // Perf metrics
  //   const alreadyInMemoryStart = performance.now()
  //   console.log('alreadyInMemoryDone', alreadyInMemoryStart - timeStart)

  //   return configsInMemory
  // }

  if (workspaces) {
    const workspaceFolder = workspaces[0]
    const { parsedConfig, didFindConfig } = getConfigs(
      workspaceFolder.uri,
      debugChannel
    )
    const gotConfigs = performance.now()
    const result = parsePredefinedAliases(parsedConfig, workspaceFolder)

    console.log('Got results', performance.now() - gotConfigs)
    console.log('Result', result)


    // if (didFindConfig && typeof parsedConfig === 'object') {
    //   const {
    //     exclude,
    //     include,
    //     extends: extendConfig,
    //     compilerOptions: { paths = null, baseUrl = null },
    //   } = parsedConfig || null

    //   console.log('Extend Config', extendConfig)

    //   if (paths && baseUrl) {
    //     const definedAliases = parsePredefinedAliases(
    //       paths,
    //       baseUrl,
    //       workspaceFolder
    //     )

    //     context.workspaceState.update('aliasConfig', Array.from(definedAliases))

    //     return definedAliases
    //   }
    // }
  }
}
