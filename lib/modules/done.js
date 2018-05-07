const defaults = {
  retryAfter: 1,
  force: false
}

export default async function done ({ meta, getLog, opt, release }) {
  opt = Object.assign(defaults, opt.done)
  const { info } = getLog('done')
  if (opt.force) return
  if (release && release.complete) {
    info(`already processed: ${meta.srcRootDir}`)
    throw new Error('skip')
  }
  if (release && release.error) {
    const hours = Math.floor((release.updatedAt - Date.now()) / (1000 * 60 * 60))
    if (hours < opt.retryAfter) {
      info(`skip now, retry later: ${meta.srcRootDir}`)
      throw new Error('skip')
    }
    await release.update({ 'error': false })
    info(`previously errored, retry now`)
  }
}