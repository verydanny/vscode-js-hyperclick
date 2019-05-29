import * as vscode from 'vscode'

export class Provider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {

    return undefined
  }
}