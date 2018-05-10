import getModules from './modules'
import {
  stat,
  readFile,
  writeFile,
  createWriteStream
} from 'mz/fs'
import prettyBytes from 'pretty-bytes'
import {
  parse,
  join
} from 'path'
import multimatch from 'multimatch'
import progress from 'progress-stream'
import ProgressBar from 'cli-progress-bar'
import {
  mkdirpSync
} from 'fs-extra'
import {
  log,
  levels as logLevels
} from './log'

const defaults = {
  roles: {
    sample: [
      '*sample*'
    ],
    archive: [
      '*.rar'
    ],
    feature: [
      '*.avi',
      '*.mkv',
      '*.wmv',
      '*.mp4',
      '!*sample*'
    ],
    subtitles: [
      '*.sub',
      '*.srt',
      '*.sbv',
      '*.sfv'
    ],
    nfo: [
      '*.nfo'
    ],
    dump: [
      'undisco.dump'
    ]
  },
  tempDir: '/tmp',
  logLevel: 'debug'
}

/**
 * wraps meta, options, logs, provides iterator to manage process
 * @type {Object}
 */
export default class Undisco {
  constructor (srcRootDir, opt = {}, ...extra) {
    // allows to easily bump options (tests)
    opt = Object.assign({}, defaults, opt, ...extra)
    this.opt = opt
    this.meta = { srcRootDir, files: [] }
    this.files = []
    this.modules = getModules(opt)
    // preserve `this` for destructuring
    // I'm sure there's a way to declare these with fat arrow.
    this.addFiles = this.addFiles.bind(this)
    this.addFile = this.addFile.bind(this)
    this.getLog = this.getLog.bind(this)
  }
  getLog (module) {
    const child = log.child({ module })
    // return plain object like:
    // { debug: (...args) => child.debug(...args), ... }
    return Object.assign(
      {},
      ...Object.values(logLevels).map((level) => ({
        [level]: (...args) => child[level](...args)
      }))
    )
  }
  asJSON () {
    return Object.assign(
      {},
      this.meta,
      {
        files: this.meta.files.map((file) => ({
          size: prettyBytes(file.size),
          path: file.path,
          destPath: file.destPath,
          role: file.role
        }))
      }
    )
  }

  async addFiles (files) {
    files = [].concat(files)
    while (files.length) {
      await this.addFile(files.pop())
    }
  }
  /**
   * adds file to files structure
   * `file.path` is always required
   * `file.contents` may be either:
   *   * undefined - file is considered to be an actual file residing on hd
   *   * Buffer - containing file content, file not on hd
   *   * stream - will write the stream to hd
   * @param  {Object}  file
   * @return {Promise}
   */
  async addFile (file) {
    const {
      getLog,
      opt: { roles, tempDir },
      meta: { files, srcRootDir }
    } = this
    const {
      error,
      debug
    } = getLog('addFile')
    // sanity checking
    if (!file.path) {
      error('addFile: bad file', file)
      throw new Error('file needs path')
    }
    if (file.contents && Buffer.isBuffer(file.contents)) {
      // for buffers you just need to set size pretty much
      file.size = file.contents.length
    } else if (file.contents && typeof file.contents.pipe === 'function') {
      // duck type readable stream
      if (!file.size) {
        // for streams you need size in order to report progress
        error('addFile: bad file', file)
        throw new Error('streamed file needs path & size')
      }
      mkdirpSync(join(tempDir, srcRootDir))
      // write stream to temp dir
      file.path = join(tempDir, srcRootDir, file.path)

      const output = createWriteStream(file.path)
      // reporter monitors the stream and returns percentage
      const reporter = progress({ length: file.size || 0, time: 500 })
      // configure a fancy progress bar
      const bar = new ProgressBar()
      bar.show(file.path, 0)
      reporter.on('progress', ({ percentage }) => {
        bar.show(file.path, percentage / 100)
      })
      file.contents
      .pipe(reporter)
      .pipe(output)
      // simple delay
      await new Promise((resolve) => file.contents.on('close', resolve))
      bar.hide()
      debug(`wrote ${file.path}`)
    } else if (file.contents) {
      throw new Error('contents must be either buffer or readable stream')
    }
    if (!file.base) Object.assign(file, parse(file.path))
    // fix this, won't work when a buffer is passed in as contents
    if (!file.mtimeMs) Object.assign(file, await stat(file.path))
    file.role = Object.keys(roles).find((role) => {
      return multimatch([file.base], roles[role]).length
    }) || 'junk'
    // log(file)
    files.push(file)
  }

  /**
   * controls async iteration over selected modules
   * @return {Promise} dump
   */
  async run () {
    const { warn, debug } = this.getLog('run')
    try {
      this.store = JSON.parse(await readFile('store.json'))
    } catch (e) {
      this.store = {}
    }
    try {
      for (let i = 0; i < this.modules.length; i++) {
        try {
          debug(this.modules[i].name)
          await this.modules[i](this)
          // catch & throw avoids uncaught promise rejection, kills for loop
        } catch (e) { throw e }
      }
      this.store[this.meta.srcRootDir] = 'complete'
    } catch (err) {
      if (err.message !== 'skip') {
        this.store[this.meta.srcRootDir] = 'error'
        warn(`unable to continue ${err.message}`)
      }
    }
    debug({ meta: this.asJSON() }, 'dump')
    await writeFile('store.json', JSON.stringify(this.store, null, 2))
    debug(`completed ${this.meta.srcRootDir}`)
    return this.asJSON()
  }
}
