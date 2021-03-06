import * as core from '@actions/core'
import * as github from '@actions/github'
import fetch from 'node-fetch'

async function run(): Promise<void> {
  try {
    await fixPrBase()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

const parsePullRequestId = (githubRef: string) => {
  const result = /refs\/pull\/(\d+)\/merge/g.exec(githubRef)
  if (!result) throw new Error('Reference not found.')
  const [, pullRequestId] = result
  return pullRequestId
}

async function fixPrBase() {
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const pullRequestId = parsePullRequestId(github.context.ref)
  const faktorySecretKey: string = core.getInput('FAKTORY_SECRET_KEY')
  const buildBranch: string = core.getInput('build_branch')
  const path = `https://api.touchlab.dev/gh/movePrBase/${owner}/${repo}/${pullRequestId}`
  const params = `buildBranch=${encodeURIComponent(buildBranch)}`
  await fetch(`${path}?${params}`, {
    headers: {"faktorySecretKey": faktorySecretKey}
  }).then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text)
        })
      } else {
        return response
      }
    })
    .then(async response => response.json())
    .then(data => console.log(data))
    .catch(error => {
      if (error instanceof Error) {
        core.setFailed(error.message)
      } else {
        core.setFailed(error)
      }
    })
}

run()
