import * as vscode from 'vscode'
import { statSync, readdirSync, existsSync } from 'fs'
import { join, relative, resolve } from 'path'

export type DirlistT = {
  name: string,
  path: string,
  folders: string[],
  options: string[]
}

/**
 * This can be an option in the extension
 */
const ignoredDirectories = ['node_modules', '.git', 'dist']
export const possibleExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'es6', 'es', 'vue']

export function extractImportPathFromTextLine(textLine: vscode.TextLine): { path: string, range: vscode.Range } | undefined {
  const pathRegs = [
    /import\s+.*\s+from\s+['"](.*)['"]/,
    /import\s*\(['"](.*)['"]\)/,
    /require\s*\(['"](.*)['"]\)/,
    /import\s+['"](.*)['"]/,
    /}\sfrom\s+['"](.*)['"]/,
    /\sfrom\s+['"](.*)['"]/,
    /from\s+['"](.*)['"]/
  ]

  for (const pathReg of pathRegs) {
    const execResult = pathReg.exec(textLine.text)

    if (execResult && execResult[1]) {
      const filePath = execResult[1]
      const filePathIndex = execResult[0].lastIndexOf(filePath)
      const start = execResult.index + filePathIndex
      const end = start + filePath.length

      return {
        path: filePath,
        range: new vscode.Range(textLine.lineNumber, start, textLine.lineNumber, end),
      }
    }
  }
}

export const findFile = (
  directory: string,
  filename: string,
) => {
  for (const extension of possibleExtensions) {
    const fileTest = join(directory,`${filename}.${extension}`)

    if (existsSync(fileTest)) {
      return fileTest
    }
  }

  return false
}

export const isDirectory = (path: string) => {
  try {
    return statSync(path).isDirectory()
  } catch(e) {
    return false
  }
}

export const isFile = (path: string) => {
  try {
    return statSync(path).isFile()
  } catch(e) {
    return false
  }
}

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
  // In a recursively searched directory structure, synchronous is better
  // In fact, it's 2x faster.
  const paths = readdirSync(dirToRecursivelyScan)

  for (const directoryPath of paths) {
    if (
      isDirectory(
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
        options: createAliasListForThisDir(thisDirFoldersArr)
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