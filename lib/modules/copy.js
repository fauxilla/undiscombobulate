import progress from 'progress-stream'
import ProgressBar from 'cli-progress-bar'
import {
  createReadStream,
  createWriteStream
} from 'fs'
import {
  stat
} from 'mz/fs'
import {
  parse
} from 'path'
import {
  mkdirpSync
} from 'fs-extra'

export default async function copy ({ meta, getLog, opt }) {
  const { info, debug } = getLog('copy')
  meta.files.filter((f) => f.destPath).forEach((file) => {
    debug({ meta: file }, file.base)
  })
  const workers = meta.files.filter((f) => f.destPath).map((file) => {
    return () => new Promise(async (resolve, reject) => {
      const exists = await stat(file.destPath)
        .catch(() => false)
      if (exists && !opt.force) {
        info(`file already exists: ${file.destPath}`)
        return resolve()
      }
      const input = createReadStream(file.path)
      const destPath = parse(file.destPath)
      mkdirpSync(destPath.dir)
      const output = createWriteStream(file.destPath)
      const reporter = progress({
        length: file.size,
        time: 100
      })
      let briefPath = destPath.base
      if (briefPath.length > 40) {
        briefPath = `${briefPath.slice(0, 17)} ... ${briefPath.slice(-18)}`
      }
      const bar = new ProgressBar()
      bar.show(briefPath, 0)
      reporter.on('progress', ({ percentage }) => {
        bar.show(briefPath, percentage / 100)
      })
      output.on('close', () => {
        bar.hide()
        info(`copied ${destPath.base}`)
        resolve()
      })
      input
        .pipe(reporter)
        .pipe(output)
    })
  })
  while (workers.length) await workers.pop()()
  meta.copied = true
}
