import * as vscode from 'vscode'

import { parsePathForDirs } from './utils'

type StorageBin = {
  name: string,
  data: import('./utils').DirlistT[]
}[]

const formatWorkspaceData = (workspaces: vscode.WorkspaceFolder[]) =>
  workspaces.map(({ name, uri }) => ({
    name,
    fsDir: uri.fsPath,
  }))

async function getDirectoryLayout(directory: string) {
  const directoryList = await parsePathForDirs(
    directory,
    [],
    directory,
  )

  return directoryList
}

async function buildFolderStructure(workspaces: vscode.WorkspaceFolder[] | undefined) {
  const storageBin: StorageBin = []

  if (workspaces) {
    const formattedWorkspaceData = formatWorkspaceData(workspaces)

    for (const { fsDir, name } of formattedWorkspaceData) {
      const data = await getDirectoryLayout(fsDir)

      storageBin.push({
        name,
        data
      })
    }
  }

  return storageBin
}

const workspaceFolders = Symbol('workspaceFolders')

export class WorkspaceDirectoryHelper {
  readonly [workspaceFolders] = vscode.workspace.workspaceFolders

  constructor() {
    // Initiate the folder struct
    this.buildWorkplaceLayout()
  }

  buildWorkplaceLayout = () => buildFolderStructure(this[workspaceFolders])

  get getWorkplaceStructure() {
    return this.buildWorkplaceLayout()
  }
}
