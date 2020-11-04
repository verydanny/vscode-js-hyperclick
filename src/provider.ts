/* eslint-disable @typescript-eslint/prefer-for-of */
import { performance } from 'perf_hooks'
import { parse as pathParse, ParsedPath } from "path"

import * as vscode from "vscode"

import { getParsedImport } from "./utils"
import { GroupExtended, StorageBinData } from "./workspace"

type Match = {
  file: boolean | ParsedPath
  folderTerm: string | null
  unsafe: boolean
  fileExtension: string | boolean
  isAliased: boolean
} & Partial<GroupExtended>

export class Provider {
  context: vscode.ExtensionContext
  documentUri?: vscode.Uri
  workspaceName?: string
  directoryLayout?: Array<import("./workspace").StorageBinData>
  cacheList: Map<string, vscode.Location>

  range = new vscode.Range(0, 0, 0, 0)

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.cacheList = new Map()
  }

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const URI = document.uri
    const currentFolder = vscode.Uri.joinPath(URI, "../")
    const importLine = document.lineAt(position)
    const workspaceName = vscode.workspace.getWorkspaceFolder(URI)
    const directoryLayout:
      | StorageBinData
      | undefined = workspaceName?.name
      ? this.context.workspaceState.get(workspaceName.name)
      : undefined
    const cachedLocation = this.cacheList.get(importLine.text)

    if (cachedLocation) {
      return cachedLocation
    }

    const start = performance.now()
    const importParsed = getParsedImport(importLine, document)
    console.log('TokenizedImportDone', performance.now() - start)

    if (importParsed && directoryLayout) {
      const worstCaseRegex = new RegExp(importParsed.path)
      const pathParseImport = pathParse(importParsed.path)
      let match: Match = {
        file: false,
        folderTerm: null,
        unsafe: false,
        fileExtension: pathParseImport.ext || false,
        isAliased: false,
      }
      let foundFolderTerm = false
      let foundFileTerm = false

      // Begin looping through directories
      for (let i = 0; i < directoryLayout.length; i++) {
        const folderSearchTerms = directoryLayout[i][0]
        const fileSearchTerms = directoryLayout[i][1]
        const fileInfo = directoryLayout[i][2]

        if (foundFileTerm) {
          break
        }

        if (foundFolderTerm) {
          // optimize later
        }

        // Try to get an exact match on folder. Break if exact folder
        // match
        for (let ti = 0; ti < folderSearchTerms.length; ti++) {
          const folderTerm = folderSearchTerms[ti]

          if (importParsed.path === folderTerm) {
            match = {
              ...match,
              ...fileInfo,
              folderTerm,
              isAliased: true
            }
            foundFolderTerm = true

            break
          }
        }
        // End folder loop

        // Try to get an exact match on fileTerm. Break if exact file
        // match
        for (let fi = 0; fi < fileSearchTerms.length; fi++) {
          const fileTerm = fileSearchTerms[fi]

          if (typeof fileTerm === "string") {
            const fileInformation = fileSearchTerms[
              fi + 1
            ] as ParsedPath

            if (fileTerm === importParsed.path) {
              match = {
                ...match,
                ...fileInfo,
                file: fileInformation,
                unsafe: false,
                isAliased: true,
              }
              foundFileTerm = true

              break
            } else if (worstCaseRegex.test(fileTerm)) {
              // This should be a percentage matcher. We want to unsafe match
              // to most likely candidate
              match = {
                ...match,
                ...fileInfo,
                file: fileInformation,
                unsafe: true,
              }
              foundFileTerm = true
            }
          }
        }
        // End file loop
      }
      // End directory loop

      // If it's an index file
      if (typeof match.file === "object" && match.fullPath) {
        // Not a regex match, probably good
        if (!match.unsafe) {
          const query = vscode.Uri.joinPath(
            vscode.Uri.parse(match.fullPath),
            match.file.base
          )
          const location = new vscode.Location(query, this.range)

          this.cacheList.set(importLine.text, location)

          const safeDone = performance.now()
          console.log('safeDone',  safeDone - start)
          return location
        }

        // Doesn't have file extension, probably aliased
        if (match.unsafe) {
          if (match.hasIndex && match.file) {
            if (match.fileExtension) {
              const query = vscode.Uri.joinPath(
                vscode.Uri.parse(match.fullPath),
                match.file.base
              )
  
              const location = new vscode.Location(query, this.range)
  
              this.cacheList.set(importLine.text, location)
  
              const unsafeFileExt = performance.now()
              console.log('unsafeFileExt', unsafeFileExt - start)
              return location
            }

            if (pathParseImport.base === match.file.name) {
              const query = vscode.Uri.joinPath(
                vscode.Uri.parse(match.fullPath),
                match.file.base
              )
  
              const location = new vscode.Location(query, this.range)
  
              this.cacheList.set(importLine.text, location)
  
              const unsafeFileNotIndexDone = performance.now()
              console.log('unsafeFileNotIndexDone', unsafeFileNotIndexDone - start)
              return location
            }

            const query = vscode.Uri.joinPath(
              vscode.Uri.parse(match.fullPath),
              match.indexValues!.join('')
            )

            const location = new vscode.Location(query, this.range)

            this.cacheList.set(importLine.text, location)

            const unsafeIndexDone = performance.now()
            console.log('unsafeIndexDone', unsafeIndexDone - start)
            return location
          }
        }
      }

      if (!match.file && match.hasIndex && match.fullPath) {
        const query = vscode.Uri.joinPath(
          vscode.Uri.parse(match.fullPath),
          match.indexValues!.join("")
        )

        const location = new vscode.Location(query, this.range)

        this.cacheList.set(importLine.text, location)

        const noFileDone = performance.now()
        console.log('noFileDone', noFileDone - start)
        return location
      }

      if (!match.file && !match.folderTerm) {
        const parsedWeird = pathParse(importParsed.path)

        if (parsedWeird.ext && /^.*/.test(parsedWeird.dir)) {
          const query = vscode.Uri.joinPath(
            currentFolder,
            importParsed.path
          )

          const location = new vscode.Location(query, this.range)

          this.cacheList.set(importLine.text, location)

          const noFolderTermOrFileDone = performance.now()
          console.log('noFolderTermOrFileDone', noFolderTermOrFileDone - start)
          return location
        }
      }
    }

    return undefined
  }
}
