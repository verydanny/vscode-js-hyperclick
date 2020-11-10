import { performance } from 'perf_hooks'
import * as vscode from 'vscode'

import { fdir, Group } from 'fdir'

import { ConfigMap } from './utils/tsconfig'

const entries: Array<Group | undefined> = []

export async function buildWorkspaceLayout(
  context: vscode.ExtensionContext,
  debugChannel: vscode.OutputChannel,
  configs?: ConfigMap
) {
  const timeStart = performance.now()
  const workspaces = vscode.workspace.workspaceFolders

  if (workspaces) {

    // const crawl = new fdir().crawlWithOptions(`${fsPath}/src`, {
    //   exclude: (dir) => dir.includes('node_modules') || dir.includes('.git') || dir.includes('.hg'),
    //   includeBasePath: true
    // }).sync()

    // console.info('fdir done', performance.now() - timeStart)

    // const crawlStart = performance.now()

    // while (crawl.length) {
    //   const entry = crawl.pop()

    //   entries.push(entry)
    // }

    // console.info('crawl done', performance.now() - crawlStart)
    // console.log(crawl)
  }

  // const stream = fg.stream('**')

  // stream.once('error', () => process.exit(0))
  // stream.on('data', (entry: string) => entries.push(entry))
  // stream.once('end', () => {
  //   console.info('Fast Glob: stream', performance.now() - timeStart)
  // })
}