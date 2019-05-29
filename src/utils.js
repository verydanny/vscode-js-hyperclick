const fs = require('fs')
const { join } = require('path')
const { promisify } = require('util')

const exists = promisify(fs.exists)
const stat = promisify(fs.stat)

const filesToCheck = ['ts', 'd.ts', 'tsx', 'js', 'jsx', 'mjs', 'es', 'es6']

const isDirectory = path => stat(path)
  .then(stats => stats.isDirectory()).catch(e => console.log(e))

const parsePathsForDirOrFile = async (basePath, directoryPaths) => {
  const filteredDirs = {
    directories: [],
    files: [],
  }

  for (const directoryPath of directoryPaths) {
    if (
      await isDirectory(
        join(basePath, directoryPath)
      )
    ) {
      filteredDirs.directories.push(directoryPath)
    } else {
      filteredDirs.files.push(directoryPath)
    }
  }

  return filteredDirs
}

const buildRelativeFolderStructures = arrayOfDirectorySections => {
  const sections = [...arrayOfDirectorySections]
  const result = []

  while (sections.length) {
    const current = sections.shift()
    result.push(join(current, sections.join('/')))
  }

  return result
}

const getIndexIfThere = (directoryToConcat, filesArray) => filesArray.map(file => {
  const fileExtensionSplit = file.split('.')
  const fileExtensionMatch = /[^.]+$/.exec(file)

  if (
    fileExtensionSplit[0] === 'index'
    && (
      fileExtensionMatch[0] === 'ts'
      || fileExtensionMatch[0] === 'js'
      || fileExtensionMatch[0] === 'jsx'
      || fileExtensionMatch[0] === 'tsx'
      || fileExtensionMatch[0] === 'mjs'
      || fileExtensionMatch[0] === 'es'
      || fileExtensionMatch[0] === 'es6'
    )
  ) {
    return join(directoryToConcat, file)
  }

  return false
}).filter(Boolean)

const isFileThere = async (path, filenames) => Promise.all(filenames.map(async file => {
  const filePath = join(path, file)
  const fileExists = await exists(filePath).catch(e => e)

  return [fileExists, file]
})).then(result => result.filter(fileresult => fileresult[0])).then(result => [].concat(...result))

const generatePossibleMatches = filename => filesToCheck.map(extension => `${filename}.${extension}`)

module.exports = {
  isDirectory,
  parsePathsForDirOrFile,
  getIndexIfThere,
  buildRelativeFolderStructures,
  filesToCheck,
  generatePossibleMatches,
  isFileThere,
}
