import Unrar from 'unrar'
import progress from 'progress-stream'
import ProgressBar from 'cli-progress-bar'
import {
  mkdirpSync
} from 'fs-extra'
import {
  // createReadStream,
  createWriteStream
} from 'fs'
import {
  join
} from 'path'
import readDir from '../readDir'

const defaults = {
  tempDir: '/tmp'
}

export default async function unrar ({ meta, logger, opt }) {
  opt = Object.assign(defaults, opt)
  const log = logger('unrar')
  const archiveFile = meta.files.find((file) => file.type === 'archive')
  if (!archiveFile) return log('no archive')
  return new Promise((resolve, reject) => {
    meta.tempPath = join(opt.tempDir, meta.srcRootDir)
    mkdirpSync(meta.tempPath)
    const archive = new Unrar(archiveFile.path)
    archive.list(async (e, entries) => {
      if (e) return reject(e)
      const workers = entries.map((entry) => {
        return () => new Promise((resolve) => {
          const input = archive.stream(entry.name)
          const output = createWriteStream(join(meta.tempPath, entry.name))
          const reporter = progress({
            length: entry.size,
            time: 100
          })
          const bar = new ProgressBar()
          bar.show(entry.name, 0)
          reporter.on('progress', ({ percentage }) => {
            bar.show(entry.name, percentage / 100)
          })
          output.on('close', () => {
            bar.hide()
            log(`extracted ${entry.name}`)
            resolve()
          })
          input
            .pipe(reporter)
            .pipe(output)
        })
      })
      while (workers.length) await workers.pop()()
      meta.files = meta.files.concat(await readDir(meta.tempPath))
      resolve()
    })
  })
}
