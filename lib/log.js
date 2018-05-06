import bunyan from 'bunyan'
import {
  Log
} from './db'
import chalk from 'chalk'

const levels = {
  '60': chalk.red('[ fatal ]'),
  '50': chalk.red('[ error ]'),
  '40': chalk.red('[ warn  ]'),
  '30': chalk.blue('[ info  ]'),
  '20': chalk.green('[ debug ]'),
  '10': 'trace'
}

export class LogStdOut {
  write ({ module, msg, level }) {
    console.log([
      levels[level],
      module ? chalk.bold(module.padEnd(14, ' ')) : '              ',
      msg
    ].join(' '))
  }
}
export class LogSql {
  write ({ module, msg, meta, level, undisco }) {
    let releaseId = null
    if (undisco && undisco.release) releaseId = undisco.release.id
    Log.create({ module, msg, meta, level, releaseId })
  }
}

export const serializers = {
  meta: (meta) => ({
    files: meta.files,
    placeholders: meta.placeholders
  }),
  err: bunyan.stdSerializers.err
}
