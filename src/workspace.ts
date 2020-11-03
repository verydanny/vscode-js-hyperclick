import { parse, ParsedPath } from 'path'

import * as vscode from 'vscode'
import { fdir as Fdir, Group } from 'fdir'

import {
  createAliasListForThisDir,
  createFileAliasListForAliases,
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

export async function buildWorkplaceLayout(
  openWorkspaces: ReadonlyArray<vscode.WorkspaceFolder>
) {
  const storageBin: StorageBin = []

  if (openWorkspaces) {
    for (const { name, uri } of openWorkspaces) {
      const fsPath = uri.fsPath

      const sorted = new Fdir()
        .crawlWithOptions(fsPath, {
          group: true,
          exclude(dirPath) {
            return dirPath.includes('node_modules') || dirPath.includes('.git')
          },
        })
        .withPromise()

      storageBin.push({
        name,
        data: (await sorted).map((item) => {
          const fileIndexValues = item.files.filter((file) => {
            if (parse(file).name === 'index') {
              return true
            }

            return false
          })

          if (item.dir === fsPath) {
            return [
              item.files,
              createFileAliasListForAliases(['/'], item.files),
              {
                ...item,
                dir: '.',
                fullPath: item.dir,
                hasIndex: fileIndexValues.length > 0,
                indexValues: fileIndexValues,
              },
            ]
          }

          const splitNormalized = item.dir.split(`${fsPath}/`).join('')
          const folderSearchTerms = createAliasListForThisDir(
            splitNormalized.split('/')
          )
          const fileSearchTerms = createFileAliasListForAliases(
            folderSearchTerms,
            item.files
          )

          return [
            folderSearchTerms,
            fileSearchTerms,
            {
              ...item,
              dir: splitNormalized,
              fullPath: item.dir,
              hasIndex: fileIndexValues.length > 0,
              indexValues: fileIndexValues,
            },
          ]
        }),
      })
    }
  }

  return storageBin
}
