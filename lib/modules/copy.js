import progress from 'progress-stream'
import ProgressBar from 'cli-progress-bar'
import {
  createReadStream,
  createWriteStream
} from 'fs'
import {
  parse
} from 'path'
import {
  mkdirpSync
} from 'fs-extra'

export default async function copy ({ meta, getLog }) {
  const { info } = getLog('copy')
  const workers = meta.files.filter((f) => f.destPath).map((file) => {
    return () => new Promise((resolve, reject) => {
      const input = createReadStream(file.path)
      const destPath = parse(file.destPath)
      mkdirpSync(destPath.dir)
      const output = createWriteStream(file.destPath)
      const reporter = progress({
        length: file.size,
        time: 100
      })
      const bar = new ProgressBar()
      bar.show(destPath.base, 0)
      reporter.on('progress', ({ percentage }) => {
        bar.show(destPath.base, percentage / 100)
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
