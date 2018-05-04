import debug from 'debug'
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
import {
  Release
} from './db'

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
    this.logs = []
    // preserve `this` for destructuring
    // I'm sure there's a way to declare these with fat arrow.
    this.logger = this.logger.bind(this)
    this.addFiles = this.addFiles.bind(this)
    this.addFile = this.addFile.bind(this)
    this.log = this.logger('undisco')
  }
  /**
   * returns namespaced logger
   * used by modules to store logs which will be dumped later, also writes
   * to `debug`
   * @param  {String} name logger namespace (keep it short)
   * @return {Function}      log fn
   */
  logger (name) {
    const dbg = debug(`undisco:${name}`)
    return (...args) => {
      dbg(...args)
      if (typeof args[0] === 'string') {
        args[0] = `${name.padEnd(15, ' ')} | ${args[0]}`
      }
      this.logs = this.logs.concat(args)
    }
  }
  async addFiles (files) {
    files = [].concat(files)
    while (files.length) {
      await this.addFile(files.pop())
    }
  }
  async addFile (file) {
    const {
      log,
      opt: { roles, tempDir },
      meta: { files, srcRootDir }
    } = this
    if (!file.path) {
      log('addFile: bad file', file)
      throw new Error('file needs path')
    }
    if (file.contents && Buffer.isBuffer(file.contents)) {
      file.size = file.contents.length
    } else if (file.contents && typeof file.contents.pipe === 'function') {
      if (!file.size) {
        log('addFile: bad file', file)
        throw new Error('streamed file needs path & size')
      }
      mkdirpSync(join(tempDir, srcRootDir))
      file.path = join(tempDir, srcRootDir, file.path)

      const output = createWriteStream(file.path)
      const reporter = progress({ length: file.size || 0, time: 500 })
      const bar = new ProgressBar()
      bar.show(file.path, 0)
      reporter.on('progress', ({ percentage }) => {
        bar.show(file.path, percentage / 100)
      })
      file.contents
      .pipe(reporter)
      .pipe(output)
      await new Promise((resolve) => file.contents.on('close', resolve))
      bar.hide()
      log(`wrote ${file.path}`)
    } else if (file.contents) {
      throw new Error('contents must be either buffer or readable stream')
    }
    if (!file.base) Object.assign(file, parse(file.path))
    if (!file.mtimeMs) Object.assign(file, await stat(file.path))
    file.role = Object.keys(roles).find((role) => {
      return multimatch([file.base], roles[role]).length
    }) || 'junk'
    // log(file)
    files.push(file)
  }
  async updateDb (complete) {
    const {
      meta: { srcRootDir }
    } = this
    await Release.upsert({
      path: srcRootDir,
      complete
    })
  }
  /**
   * controls async iteration over selected modules
   * @return {Promise} dump
   */
  async run () {
    const log = this.logger('run')
    const { verbose } = this.opt
    try {
      for (let i = 0; i < this.modules.length; i++) {
        try {
          if (verbose) log(this.modules[i].name)
          await this.modules[i](this)
          // catch & throw avoids uncaught promise rejection, kills for loop
        } catch (e) { throw e }
      }
      await this.updateDb(true)
      await dump(this)
      return
    } catch (err) {
      if (err.message !== 'skip') {
        log(`unable to continue ${err.message}`)
        this.updateDb(false)
        this.meta.errorStack = err.stack
      }
      return await dump(this)
    }
  }
}
