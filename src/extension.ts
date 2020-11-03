/* eslint-disable promise/catch-or-return */
import vscode from 'vscode'

import { possibleExtensions } from './utils'
import { Provider } from './provider'
import { buildWorkplaceLayout } from './workspace'

export function activate(context: vscode.ExtensionContext) {
  const schema = {
    scheme: 'file',
    pattern: `**/*.{${possibleExtensions.toString()}}`,
  }
  const defProvider = new Provider(context)
  // //
  // This is costly so we want to store the results in VScode
  // workspace storage.
  // //
  async function updateFileCache() {
    const openWorkspaces = vscode.workspace.workspaceFolders

    if (openWorkspaces) {
      const Workspaces = await buildWorkplaceLayout(openWorkspaces)

      if (Workspaces) {
        for (const { name, data } of Workspaces) {
          context.workspaceState.update(name, data)
        }
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
