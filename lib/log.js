import bunyan from 'bunyan'
import prettyjson from 'prettyjson'
import prettyMs from 'pretty-ms'
import {
  Log
} from './db'
import chalk from 'chalk'

const levelsFormat = {
  '60': chalk.red('[ fatal ] '),
  '50': chalk.red('[ error ] '),
  '40': chalk.red('[ warn  ] '),
  '30': chalk.blue('[ info  ] '),
  '20': chalk.green('[ debug ] '),
  '15': chalk.green('[ dump  ] '),
  '10': 'trace'
}

export const levels = {
  '60': 'fatal',
  '50': 'error',
  '40': 'warn',
  '30': 'info',
  '20': 'debug',
  '15': 'dump',
  '10': 'trace'
}

export class LogStdOut {
  constructor () {
    this.msDiff = Date.now()
  }
  write ({ module, msg, meta, level }) {
    const msDiff = Date.now() - this.msDiff
    this.msDiff = Date.now()
    const prefix = [
      levelsFormat[level],
      chalk.gray(prettyMs(msDiff).padEnd(7, ' ')),
      module ? chalk.bold(module.padEnd(10, ' ')) : '          '
    ].join('')
    console.log(''.concat(prefix, msg))
    if (meta) console.log(''.concat(prefix, '\n', prettyjson.render(meta)))
  }
}

let lastLog = Promise.resolve()

export class LogSql {
  write ({ module, msg, meta, level, undisco }) {
    let releaseId = null
    if (undisco && undisco.release) releaseId = undisco.release.id
    // lastLog emulates a static property, always set to last outstanding
    // write
    lastLog = Log.create({ module, msg, meta, level, releaseId })
  }
  /**
   * return promise from lastLog
   * @return {Promise} resolve when last log has been written
   */
  static lastLog () {
    return lastLog
  }
}

export const serializers = {
  meta: (meta) => meta,
  // meta: (meta) => ({
  //   files: meta.files,
  //   placeholders: meta.placeholders
  // }),
  err: bunyan.stdSerializers.err
}
