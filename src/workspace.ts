import * as vscode from 'vscode'

import { parsePathForDirs } from './utils'

export type StorageBin = {
  name: string,
  data: import('./utils').DirlistT[]
}[]

export type FormatWorkspaceData = {
  name: string;
  fsDir: string;
}[]

/**
 * 
 * @param workspaces vscode.WorkspaceFolder[]
 * @description Just extracts the name and fs-compatible absolute path for the workspace
 */
const formatWorkspaceData = (workspaces: vscode.WorkspaceFolder[]) =>
  workspaces.map(({ name, uri }) => ({
    name,
    fsDir: uri.fsPath,
  }))

async function buildFolderStructure(workspaces: vscode.WorkspaceFolder[] | undefined) {
  const storageBin: StorageBin = []

  if (workspaces) {
    const formattedWorkspaceData = formatWorkspaceData(workspaces)

    // This might be possible to break into 2 worker threads. One scans 1 directory
    // And the other can scan the other
    for (const { fsDir, name } of formattedWorkspaceData) {
      storageBin.push({
        name,
        data: await parsePathForDirs(fsDir, [], fsDir)
      })
    }
  }

  return storageBin
}

const workspaceFolders = Symbol('workspaceFolders')

export class WorkspaceDirectoryHelper {
  readonly [workspaceFolders] = vscode.workspace.workspaceFolders

  buildWorkplaceLayout = () => buildFolderStructure(this[workspaceFolders])
}
