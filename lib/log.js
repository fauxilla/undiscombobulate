import bunyan from 'bunyan'
import prettyjson from 'prettyjson'
import prettyMs from 'pretty-ms'
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

class LogStdOut {
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
    if (meta) {
      const padding = [
        ' '.repeat(28),
        '| '
      ].join('')
      let dump = prettyjson.render(meta)
      dump = dump.replace(/\n/g, `\n${padding}`)
      dump = padding.concat(dump)
      console.log(dump)
    }
  }
}

const serializers = {
  meta: (meta) => meta,
  // meta: (meta) => ({
  //   files: meta.files,
  //   placeholders: meta.placeholders
  // }),
  err: bunyan.stdSerializers.err
}

export const log = bunyan.createLogger({
  name: 'undisco',
  level: 'debug',
  streams: [
    { type: 'raw', serializers, stream: new LogStdOut() },
    {
      type: 'rotating-file',
      serializers,
      path: 'undisco.log',
      period: '1d',
      count: 3
    }
  ]
})
