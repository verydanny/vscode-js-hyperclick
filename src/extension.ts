import * as vscode from 'vscode'
import { Provider } from './provider'
import { WorkspaceDirectoryHelper } from './workspace'

export async function activate(context: vscode.ExtensionContext) {
  ////
  // This is costly so we want to store the results in VScode 
  // workspace storage. Maybe cache it in VScode global storage under
  // a UUID/HASH? Thought for later
  ////
  const WorkspaceHelper = new WorkspaceDirectoryHelper()
  const Workspaces = await WorkspaceHelper.buildWorkplaceLayout()

  if (Workspaces) {
    for (const { name, data } of Workspaces) {
      context.workspaceState.update(name, data)
    }
  }

  const languageProviders = [
    { scheme: 'file', language: 'javascript' },
    { scheme: 'file', language: 'javascriptreact' },
  ]

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    languageProviders, new Provider(context)
  )

  context.subscriptions.push(definitionProvider)
}

export function deactivate() {}
