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

export async function buildWorkplaceLayout(
  openWorkspaces: ReadonlyArray<vscode.WorkspaceFolder>,
  ignoredFolders: string[],
  resolvedExt: string[]
) {
  const storageBin: StorageBin = []

  if (openWorkspaces) {
    for (const { name, uri } of openWorkspaces) {
      const fsPath = uri.fsPath

      const sorted = (new Fdir()
        .crawlWithOptions(fsPath, {
          group: true,
          exclude(dirPath) {
            return ignoredFolders.some((folder) => dirPath.includes(folder))
          }
        })
        .withPromise() as any) as Promise<Output>

      const data = sortIntoDirStructure(await sorted, fsPath, resolvedExt)

      storageBin.push({
        name,
        data
      })
    }
  }

  return storageBin
}
