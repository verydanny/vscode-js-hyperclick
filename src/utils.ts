/* eslint-disable @typescript-eslint/prefer-for-of */
import { join, parse } from 'path'

export interface DirlistT {
  name: string
  path: string
  folders: string[]
  options: string[]
}

/**
 * This can be an option in the extension
 */
// Might be too many
export const possibleExtensions = ['js', 'jsx', 'ts', 'tsx']

export const createAliasListForThisDir = (folderSections: string[]) => {
  const result = []

  while (folderSections.length) {
    const current = folderSections.shift()

    if (current) {
      result.push(join(current, folderSections.join('/')))
    }
  }

  return result
}

export const createFileAliasListForAliases = (
  folderSections: string[],
  filesArray: string[]
) => {
  const result = []

  for (let i = 0; i < folderSections.length; i++) {
    const currentFolder = folderSections[i]

    for (let fi = 0; fi < filesArray.length; fi++) {
      const currentFile = parse(filesArray[fi])

      result.push(
        `${currentFolder}/${currentFile.name}`,
        currentFile,
        `${currentFolder}/${currentFile.base}`,
        currentFile
      )
    }
  }

  return result
}
