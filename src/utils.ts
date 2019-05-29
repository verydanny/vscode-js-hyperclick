import * as fs from 'fs'
import { join, relative, resolve } from 'path'
import { promisify } from 'util'

const readdir = promisify(fs.readdir)
const exists = promisify(fs.exists)
const stat = promisify(fs.stat)

export type DirlistT = {
  name: string,
  path: string,
  folders: string[],
  options: string[],
  dirnameRegex: RegExp,
}

/**
 * This can be an option in the extension
 */
const ignoredDirectories = ['node_modules', '.git']

export const isDirectory = (path: string) => stat(path)
  .then(stats => stats.isDirectory()).catch(e => e)

export const createAliasListForThisDir = (folderSections: string[]) => {
  const sections = [...folderSections]
  const result = []

  while (sections.length) {
    const current = sections.shift()

    if (current) {
      result.push(
        join(current, sections.join('/'))
      )
    }
  }

  return result
}

/**
 * @param basePath {string} fs-valid absolute path to join to directory path
 * @param directoryPaths {string} directory string
 * 
 * @example 
 * parsePathsForDir('/Users/example/source/project', 'src')
 */
export const parsePathForDirs = async (
  dirToRecursivelyScan: string,
  dirList: DirlistT[],
  baseDir: string,
) => {
  dirList = dirList || []
  const paths = await readdir(dirToRecursivelyScan)

  for (const directoryPath of paths) {
    if (
      await isDirectory(
        join(dirToRecursivelyScan, directoryPath)
      )
      && ignoredDirectories.indexOf(directoryPath) === -1
    ) {
      const thisDirConcatenatedToPreviousDir = join(dirToRecursivelyScan, directoryPath)
      const thisDirRelativeToBaseDir = relative(
        baseDir,
        thisDirConcatenatedToPreviousDir
      )
      const thisDirFoldersArr = thisDirRelativeToBaseDir.split('/')
      
      dirList.push({
        name: thisDirRelativeToBaseDir,
        path: resolve(
          baseDir,
          thisDirRelativeToBaseDir
        ),
        folders: thisDirFoldersArr,
        options: createAliasListForThisDir(thisDirFoldersArr),
        dirnameRegex: new RegExp(thisDirRelativeToBaseDir)
      })

      dirList = await parsePathForDirs(
        thisDirConcatenatedToPreviousDir,
        dirList,
        baseDir,
      )
    }
  }

  return dirList
}