const fs = require('fs')
const {
  join,
  relative,
  parse,
  resolve,
} = require('path')
const { promisify } = require('util')

const {
  parsePathsForDirOrFile,
  buildRelativeFolderStructures,
  generatePossibleMatches,
  isFileThere,
} = require('./utils')

const cwd = '/Users/daniilveremchuk/source/rent-js'
const readdir = promisify(fs.readdir)

async function getFolderStructure(starterFolder) {
  const allDirs = {}
  const totalExtensionlessFiles = []
  const totalRelativeDirectories = []

  async function getDirectoryLayout(directory) {
    const directoryPaths = [
      ...(await readdir(directory)),
    ]

    const builtCurrentRelativeDirectory = relative(
      cwd,
      directory
    )

    const builtCurrentRelativeDirectoryRegex = new RegExp(builtCurrentRelativeDirectory)
    const builtCurrentRelativeDirectorySections = builtCurrentRelativeDirectory.split('/')
    const builtCurrentRelativeDirectoryOptions = buildRelativeFolderStructures(builtCurrentRelativeDirectorySections)
    const builtCurrentRelativeDirectoryPath = resolve(builtCurrentRelativeDirectory)

    const { directories, files } = await parsePathsForDirOrFile(directory, directoryPaths)

    const relativeDirObject = {
      dirName: builtCurrentRelativeDirectory,
      path: builtCurrentRelativeDirectoryPath,
      sections: builtCurrentRelativeDirectorySections,
      options: builtCurrentRelativeDirectoryOptions,
      dirNameRegex: builtCurrentRelativeDirectoryRegex,
    }

    totalRelativeDirectories.push(relativeDirObject)

    for (const file of files) {
      const splitFileName = file.split('.')

      // if it starts with a " ", that means whole file is extension
      if (
        splitFileName[0] === ''
      ) {
        totalExtensionlessFiles.push(
          file
        )
      } else if (
        splitFileName.length > 1
        && splitFileName
      ) {
        totalExtensionlessFiles.push(splitFileName[0])
      }
    }

    allDirs[builtCurrentRelativeDirectoryPath] = directories

    /**
     * Change this part to return array of deeper dirs so it's not a recursive function
     * But can just return next array of dirs.
     * This can be better in general.
     */
    for (const dir of directories) {
      if (
        dir !== 'node_modules'
      // filter out hidden dirs
      && dir.split('.').length === 1
      ) {
        await getDirectoryLayout(join(directory, dir))
      }
    }
  }

  await getDirectoryLayout(starterFolder)

  return {
    allDirs,
    totalExtensionlessFiles,
    totalRelativeDirectories,
  }
}

async function tryToDeduceModule(dirstring) {
  const { dir, base } = parse(dirstring)
  /**
   * @NOTE: We just want to return if it's a relative or absolute file
   * so no '/file', './file', '../file'
   */
  const { totalRelativeDirectories } = await getFolderStructure(cwd)
  const possibleMatches = []

  totalRelativeDirectories.forEach(directory => {
    if (directory.options) {
      directory.options.forEach((option, index) => {
        if (option === dirstring) {
          console.log(`\nInitial Check: "${dirstring}" is probably an alias`)
          possibleMatches.push({
            ...directory,
            whichOption: index,
            wholeStringMatch: true,
          })
        } else if (option === dir) {
          console.log(`\nInitial Check: "${dir}" is probably an alias`)
          possibleMatches.push({
            ...directory,
            whichOption: index,
            wholeStringMatch: false,
          })
        }
      })
    }
  })

  possibleMatches.forEach(async match => {
    const {
      sections,
      path,
      whichOption,
      wholeStringMatch,
    } = match
    const filename = match.wholeStringMatch
      ? generatePossibleMatches('index')
      : base.split('.').length === 1
        ? generatePossibleMatches(base)
        : [base]
    const [
      fileIsThere,
      fileThatIsThere,
    ] = await isFileThere(path, filename)

    if (
      fileIsThere
    ) {
      let buildPath = ''

      for (let i = 0; i <= whichOption; ++i) {
        buildPath = join(buildPath, sections[i])
      }

      const lookupBaseDir = resolve(cwd, buildPath)

      return console.log(
        `Check 1: "${wholeStringMatch ? dirstring : dir}" is a directory`,
        `\nCheck 2: "${wholeStringMatch ? dirstring : dir}/${fileThatIsThere}" found. Rewriting alias.`,
        `\nRewriting: "${join(sections[whichOption])}/*" -> "${resolve(lookupBaseDir)}"`
      )
    }

    return false
  })
}

tryToDeduceModule('server/middleware')
