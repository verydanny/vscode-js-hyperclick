import * as vscode from 'vscode'
import { Provider } from './provider'
import { WorkspaceDirectoryHelper } from './workspace'

export async function activate(context: vscode.ExtensionContext) {
  const Workspace = new WorkspaceDirectoryHelper()
  const Workspaces = await Workspace.getWorkplaceStructure

  if (Workspaces) {
    for (const { name, data } of Workspaces) {
      context.workspaceState.update(name, data)
    }
  }

  const languageProviders = [
    { scheme: 'file', language: 'javascript' },
    { scheme: 'file', language: 'javascriptreact' },
  ]

  const disposable = vscode.languages.registerDefinitionProvider(languageProviders, new Provider())

  context.subscriptions.push(disposable)
}

export function deactivate() {}
