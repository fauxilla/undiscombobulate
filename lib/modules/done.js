import {
  Release
} from '../db'
import {
  parse
} from 'path'

const defaults = {
  retryAfter: 1,
  redo: false
}

export default async function skip ({ meta, logger, opt }) {
  opt = Object.assign(defaults, opt.done)
  const log = logger('done')
  const {
    base
  } = await parse(meta.srcRootDir)
  if (opt.redo) return
  opt = Object.assign(defaults, opt.done)
  const record = await Release.findOne({ where: { path: meta.srcRootDir } })
  if (record && record.complete) {
    log(`already processed: ${base}`)
    throw new Error('skip')
  }
  if (record) {
    const hours = Math.floor((record.updatedAt - Date.now()) / (1000 * 60 * 60))
    if (hours < opt.retryAfter) {
      log(`skip now, try later: ${base}`)
      throw new Error('skip')
    }
    log(`previously errored, trying again`)
  }
}
