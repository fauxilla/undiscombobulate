import {
  Release
} from '../db'

const defaults = {
  retryAfter: 1
}

export default async function skip ({ meta, logger, opt }) {
  const log = logger('done')
  opt = Object.assign(defaults, opt)
  const record = Release.findOne({ where: { path: meta.srcRootDir } })
  if (record && record.complete) return
  if (record) {
    const hours = Math.floor((record.updatedAt - Date.now()) / (1000 * 60 * 60))
    if (hours < opt.skip.retryAfter) {
      log(`skip now, try later: ${meta.srcRootDir}`)
      throw new Error('skip')
    }
    log(`previously errored, trying again`)
  }
}
