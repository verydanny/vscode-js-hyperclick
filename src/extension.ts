import * as vscode from 'vscode'

import { performance } from 'perf_hooks'
import { possibleExtensions } from './utils'
// import { Provider } from './provider'
// import { buildWorkplaceLayout } from './workspace'

// next
import { getPotentialConfigs } from './next/utils/tsconfig'
import { buildWorkspaceLayout } from './next/workspace'
import { SmartGoToProvider } from './next/provider'

const languages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'jsx-tags', 'svelte', 'vue']
const schemas: vscode.DocumentSelector = languages.map(language => ({
  scheme: 'file',
  language,
}))

export function activate(context: vscode.ExtensionContext) {
  const startPlugin = performance.now()
  const debugChannel = vscode.window.createOutputChannel('smart-goto')

  // const schema = {
  //   scheme: 'file',
  //   pattern: `**/*.{${possibleExtensions.toString()}}`
  // }
  const ignoredFolders = vscode.workspace
    .getConfiguration('smart-goto')
    .get('ignoreFolders') as string[]
  const resolvedExtensions = vscode.workspace
    .getConfiguration('smart-goto')
    .get('resolveExtensions') as string[]

  console.log('Started smart-goto', performance.now() - startPlugin)
  
  // compose these functions later
  const configs = getPotentialConfigs(context, debugChannel)
  const layout = buildWorkspaceLayout(context, debugChannel, configs)

  // context.subscriptions.push(
  //   vscode.languages.registerDefinitionProvider(schemas, new SmartGoToProvider(context))
  // )
  // const layout = buildWorkspaceLayout(context, debugChannel)
  // const defProvider = new Provider(context)
  // // //
  // // This is costly so we want to store the results in VScode
  // // workspace storage.
  // // //
  // async function updateFileCache() {
  //   const openWorkspaces = vscode.workspace.workspaceFolders

  //   if (openWorkspaces) {
  //     const startDir = performance.now()
  //     const workspaces = await buildWorkplaceLayout(
  //       openWorkspaces,
  //       ignoredFolders,
  //       resolvedExtensions
  //     )

  //     console.log('doneDir', performance.now() - startDir)

  //     if (workspaces && Array.isArray(workspaces)) {
  //       for (const { name, data } of workspaces) {
  //         context.workspaceState.update(name, data)
  //       }
  //     } else {
  //       context.workspaceState.update(workspaces.name, workspaces.data)
  //     }
  //   }
  // }

  // const definitionProvider = vscode.languages.registerDefinitionProvider(
  //   schema,
  //   defProvider
  // )
  // const onSwitchWorkplace = vscode.workspace.onDidChangeWorkspaceFolders(
  //   updateFileCache
  // )
  // const onDidCreateFiles = vscode.workspace.onDidCreateFiles(updateFileCache)
  // const onDidDeleteFiles = vscode.workspace.onDidDeleteFiles(updateFileCache)
  // const onDidRenameFiles = vscode.workspace.onDidRenameFiles(updateFileCache)
  // const onDidChangeConfig = vscode.workspace.onDidChangeConfiguration(
  //   updateFileCache
  // )

  // context.subscriptions.push(definitionProvider)
  // updateFileCache().then(() =>
  //   context.subscriptions.push(
  //     onDidCreateFiles,
  //     onDidDeleteFiles,
  //     onDidRenameFiles,
  //     onDidChangeConfig,
  //     onSwitchWorkplace
  //   )
  // )
}

export function deactivate() {}
