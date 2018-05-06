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

export default async function skip ({ meta, getLog, opt }) {
  opt = Object.assign(defaults, opt.done)
  const { info } = getLog('done')
  const {
    base
  } = await parse(meta.srcRootDir)
  if (opt.redo) return
  opt = Object.assign(defaults, opt.done)
  const record = await Release.findOne({ where: { path: meta.srcRootDir } })
  if (record && record.complete) {
    info(`already processed: ${base}`)
    throw new Error('skip')
  }
  if (record) {
    const hours = Math.floor((record.updatedAt - Date.now()) / (1000 * 60 * 60))
    if (hours < opt.retryAfter) {
      info(`skip now, try later: ${base}`)
      throw new Error('skip')
    }
    info(`previously errored, trying again`)
  }
}
