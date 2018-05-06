import dump from './dump'
import getModules from './modules'
import {
  stat,
  createWriteStream
} from 'mz/fs'
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
import bunyan from 'bunyan'
import {
  Release
} from './db'
import {
  LogStdOut,
  LogSql,
  serializers
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
  verbose: false
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
    this.log = bunyan.createLogger({
      name: 'undisco',
      level: 'debug',
      undisco: this,
      streams: [
        // { stream: process.stdout },
        { type: 'raw', serializers, stream: new LogStdOut() },
        { type: 'raw', serializers, stream: new LogSql(this) }
      ]
    })
  }
  getLog (module) {
    const undisco = this
    function log (level, ...args) {
      if (typeof args[0] !== 'string') Object.assign(args[0], { module })
      else args.unshift({ module })
      undisco.log[level](...args)
    }
    return {
      debug: (...args) => log('debug', ...args),
      info: (...args) => log('info', ...args),
      warn: (...args) => log('warn', ...args),
      error: (...args) => log('error', ...args)
    }
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
    this.release = (await Release.findOrCreate({
      where: { path: this.meta.srcRootDir }
    }))[0]
    try {
      for (let i = 0; i < this.modules.length; i++) {
        try {
          debug(this.modules[i].name)
          await this.modules[i](this)
          // catch & throw avoids uncaught promise rejection, kills for loop
        } catch (e) { throw e }
      }
      await this.release.update({ 'complete': true })
      await dump(this)
      return
    } catch (err) {
      if (err.message !== 'skip') {
        await this.release.update({ 'error': true })
        warn(`unable to continue ${err.message}`)
      }
      return await dump(this)
    }
  }
}
