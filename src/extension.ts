import * as vscode from 'vscode'

import { performance } from 'perf_hooks'
import { possibleExtensions } from './utils'
import { Provider } from './provider'
import { buildWorkplaceLayout } from './workspace'

export function activate(context: vscode.ExtensionContext) {
  const schema = {
    scheme: 'file',
    pattern: `**/*.{${possibleExtensions.toString()}}`
  }
  const ignoredFolders = vscode.workspace
    .getConfiguration('smart-goto')
    .get('ignoreFolders') as string[]
  const resolvedExtensions = vscode.workspace
    .getConfiguration('smart-goto')
    .get('resolveExtensions') as string[]
  const defProvider = new Provider(context)
  // //
  // This is costly so we want to store the results in VScode
  // workspace storage.
  // //
  async function updateFileCache() {
    const openWorkspaces = vscode.workspace.workspaceFolders

    if (openWorkspaces) {
      const startDir = performance.now()
      const workspaces = buildWorkplaceLayout(
        openWorkspaces,
        ignoredFolders,
        resolvedExtensions
      )
      const doneDir = performance.now()
      console.log('doneDir', doneDir - startDir)

      if (workspaces && Array.isArray(workspaces)) {
        for (const { name, data } of workspaces) {
          context.workspaceState.update(name, data)
        }
      } else {
        context.workspaceState.update(workspaces.name, workspaces.data)
      }
    }
  }

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    schema,
    defProvider
  )
  const onSwitchWorkplace = vscode.workspace.onDidChangeWorkspaceFolders(
    updateFileCache
  )
  const onDidCreateFiles = vscode.workspace.onDidCreateFiles(updateFileCache)
  const onDidDeleteFiles = vscode.workspace.onDidDeleteFiles(updateFileCache)
  const onDidRenameFiles = vscode.workspace.onDidRenameFiles(updateFileCache)
  const onDidChangeConfig = vscode.workspace.onDidChangeConfiguration(
    updateFileCache
  )

  context.subscriptions.push(definitionProvider)

  // Just a stub promise
  updateFileCache().then(() =>
    context.subscriptions.push(
      onDidCreateFiles,
      onDidDeleteFiles,
      onDidRenameFiles,
      onDidChangeConfig,
      onSwitchWorkplace
    )
  )
}

export function deactivate() {}
