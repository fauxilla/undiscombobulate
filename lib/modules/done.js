const defaults = {
  retryAfter: 1,
  force: false
}

export default async function done ({ meta, getLog, opt, store }) {
  opt = Object.assign(defaults, opt.done)
  const { info } = getLog('done')
  if (opt.force) return
  if (store[meta.srcRootDir] === 'complete') {
    info(`already processed: ${meta.srcRootDir}`)
    throw new Error('skip')
  }
  if (store[meta.srcRootDir] === 'error') {
    info(`errored previously: ${meta.srcRootDir}`)
    throw new Error('skip')
  }
}
