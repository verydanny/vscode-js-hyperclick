import { parse, ParsedPath } from 'path'
import { performance } from 'perf_hooks'
import * as vscode from 'vscode'
import { fdir as Fdir, Group, Output } from 'fdir'

import {
  createAliasListForThisDir,
  createFileAliasListForAliases
} from './utils'

export interface GroupExtended extends Group {
  fullPath: string
  hasIndex: boolean
  indexValues: string[]
}

export type StorageBinData = Array<
  [string[], Array<string | ParsedPath>, GroupExtended]
>

export type StorageBin = Array<{
  name: string
  // data: Array<import('./utils').DirlistT>
  data: StorageBinData
}>

export type FormatWorkspaceData = Array<{
  name: string
  fsDir: string
}>

function sortIntoDirStructure(
  dirs: Output,
  fsPath: string,
  resolvedExt: string[]
) {
  const startSort = performance.now()

  const result = dirs.map((item) => {
    const fileIndexValues = item.files.filter((file) => {
      if (parse(file).name === 'index') {
        return true
      }

      return false
    })

    if (item.dir === fsPath) {
      return [
        item.files,
        createFileAliasListForAliases(['/'], item.files, resolvedExt),
        {
          ...item,
          dir: '.',
          fullPath: item.dir,
          hasIndex: fileIndexValues.length > 0,
          indexValues: fileIndexValues
        }
      ]
    }

    const splitNormalized = item.dir.split(`${fsPath}/`).join('')
    const folderSearchTerms = createAliasListForThisDir(
      splitNormalized.split('/')
    )
    const fileSearchTerms = createFileAliasListForAliases(
      folderSearchTerms,
      item.files,
      resolvedExt
    )

    return [
      folderSearchTerms,
      fileSearchTerms,
      {
        ...item,
        dir: splitNormalized,
        fullPath: item.dir,
        hasIndex: fileIndexValues.length > 0,
        indexValues: fileIndexValues
      }
    ]
  })

  console.log('sortTime', performance.now() - startSort)

  return result as StorageBinData
}

function crawlWorkspaces(fsPath: string, ignoredFolders: string[]) {
  return (new Fdir()
    .crawlWithOptions(fsPath, {
      group: true,
      exclude(dirPath) {
        return ignoredFolders.some((folder) => dirPath.includes(folder))
      }
    })
    .sync() as any) as Output
}

export function buildWorkplaceLayout(
  openWorkspaces: ReadonlyArray<vscode.WorkspaceFolder>,
  ignoredFolders: string[],
  resolvedExt: string[]
) {
  const storageBin: StorageBin = []

  if (openWorkspaces) {
    if (openWorkspaces.length === 1) {
      const fsPath = openWorkspaces[0].uri.fsPath
      const data = sortIntoDirStructure(
        crawlWorkspaces(fsPath, ignoredFolders),
        fsPath,
        resolvedExt
      )

      return {
        name: openWorkspaces[0].name,
        data
      }
    }

    for (const { name, uri } of openWorkspaces) {
      const fsPath = uri.fsPath
      const data = sortIntoDirStructure(
        crawlWorkspaces(fsPath, ignoredFolders),
        fsPath,
        resolvedExt
      )

      storageBin.push({
        name,
        data
      })
    }
  }

  return storageBin
}
