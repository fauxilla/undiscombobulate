import bunyan from 'bunyan'
import prettyjson from 'prettyjson'
import {
  Log
} from './db'
import chalk from 'chalk'

const levels = {
  '60': chalk.red('[ fatal ] '),
  '50': chalk.red('[ error ] '),
  '40': chalk.red('[ warn  ] '),
  '30': chalk.blue('[ info  ] '),
  '20': chalk.green('[ debug ] '),
  '10': 'trace'
}

export class LogStdOut {
  write ({ module, msg, meta, level }) {
    const prefix = [
      levels[level],
      module ? chalk.bold(module.padEnd(15, ' ')) : '               '
    ].join('')
    console.log(''.concat(prefix, msg))
    if (meta) console.log(''.concat(prefix, '\n', prettyjson.render(meta)))
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
