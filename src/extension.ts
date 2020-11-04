import * as vscode from 'vscode'

import { possibleExtensions } from './utils'
import { Provider } from './provider'
import { buildWorkplaceLayout } from './workspace'

export function activate(context: vscode.ExtensionContext) {
  console.log(vscode.extensions.getExtension('vscode.typescript-language-features')?.exports)
  const schema = {
    scheme: 'file',
    pattern: `**/*.{${possibleExtensions.toString()}}`,
  }
  // vscode.typescript-language-features
  const defProvider = new Provider(context)
  // //
  // This is costly so we want to store the results in VScode
  // workspace storage.
  // //
  async function updateFileCache() {
    const openWorkspaces = vscode.workspace.workspaceFolders

    if (openWorkspaces) {
      const workspaces = await buildWorkplaceLayout(openWorkspaces)

      if (workspaces) {
        for (const { name, data } of workspaces) {
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
