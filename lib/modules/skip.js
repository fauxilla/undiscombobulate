import hjson from 'hjson'
import {
  readFile
} from 'mz/fs'

const defaults = {
  retryAfter: 1
}

export default async function skip ({ meta, logger, opt }) {
  const log = logger('skip')
  opt = Object.assign(defaults, opt)
  if (!meta.files.find((file) => ['feature', 'archive'].includes(file.type))) {
    log(`no video in this directory, will skip`)
    throw new Error('skip')
  }
  if (opt.skip.ignoreDump) return

  const dump = meta.files.find((file) => file.type === 'dump')
  // if there's no dump file, it hasn't been tried before, don't skip
  if (!dump) return
  const err = hjson.parse(await readFile(dump.path, 'utf8')).errorStack
  // if there's no error, this folder was processed successfuly, skip it
  if (!err) {
    log(`already processed: ${meta.srcRootDir}`)
    throw new Error('skip')
  }
  const hours = Math.floor((dump.mtimeMs - Date.now()) / (1000 * 60 * 60))
  // if there's an error, but we've tried recently, skip it this time.
  if (hours < opt.skip.retryAfter) {
    log(`skip now, try later: ${meta.srcRootDir}`)
    throw new Error('skip')
  }
  log(`release errored last time, will retry now`)
}
