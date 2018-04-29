import debug from 'debug'
import dump from './dump'
import getModules from './modules'
import {
  stat
} from 'mz/fs'
import {
  parse
} from 'path'
import multimatch from 'multimatch'

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
  }
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
    this.meta = { srcRootDir }
    this.modules = getModules(opt)
    this.logs = []
    // preserve `this` for destructuring
    this.logger = this.logger.bind(this)
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
      const file = files.shift()
      const {
        log,
        opt: { roles }
      } = this
      if (!file.base && !file.path) {
        log('addFile: bad file', file)
        throw new Error('file needs either base or path')
      }
      if (file.path) {
        Object.assign(
          file,
          parse(file.path),
          file.size ? {} : await stat(file.path) // stat if not already
        )
      }
      file.role = Object.keys(roles).find((role) => {
        return multimatch([file.base], roles[role]).length
      }) || 'junk'
      this.files.push(file)
    }
  }
  /**
   * controls async iteration over selected modules
   * @return {Promise} dump
   */
  async run () {
    const log = this.logger('run')
    log(`processing ${this.meta.srcRootDir}`)
    try {
      for (let i = 0; i < this.modules.length; i++) {
        try {
          log(this.modules[i].name)
          await this.modules[i](this)
          // catch & throw avoids uncaught promise rejection, kills for loop
        } catch (e) { throw e }
      }
      return await dump(this)
    } catch (err) {
      if (err.message !== 'skip') {
        log(`unable to continue ${err.message}`)
        this.meta.errorStack = err.stack
      }
      return await dump(this)
    }
  }
}
