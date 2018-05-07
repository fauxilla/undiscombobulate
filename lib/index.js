#!/usr/bin/env node
import 'babel-polyfill'
import Undisco from './Undisco'
import listDirs from './listDirs'
import fontAscii from 'font-ascii'
import {
  watch
} from 'chokidar'
import {
  options,
  usage
} from './options'
import {
  sep
} from 'path'
import bunyan from 'bunyan'
import {
  LogStdOut,
  levels as logLevels
} from './log'
import {
  getLog
} from './db'

const log = bunyan.createLogger({
  name: 'undisco',
  level: 'debug',
  undisco: this,
  streams: [{ type: 'raw', stream: new LogStdOut() }]
})

/**
 * main controller, determines run mode & monitors
 * @param  {Object} opt options
 * @return {Object}     returns dumps, only in `once` mode
 */
async function undisco (opt) {
  const commands = {
    log: runLog,
    watch: runWatch,
    once: runOnce,
    dir: runDir,
    usage: runUsage
  }
  await commands[opt.command](opt)
}

async function runOnce (opt) {
  log.info(`run once on ${opt.downloadsPath}`)
  const dirs = await listDirs(opt.downloadsPath, opt.depth)
  log.debug(`${dirs.length} entries in ${opt.downloadsPath}`)
  const workers = dirs.map((dir) => new Undisco(dir, opt))
  while (workers.length) await workers.shift().run()
}

async function runWatch (opt) {
  const depth = opt.downloadsPath.split(sep).length
  log.debug(`${opt.poll ? 'polling ' : 'watching '} ${opt.downloadsPath}`)
  watch(
    opt.downloadsPath,
    Object.assign(
      {
        depth: opt.downloadsDepth,
        usePolling: Boolean(opt.poll),
        awaitWriteFinish: {
          stabilityThreshold: 10000,
          pollInterval: 10000
        }
      },
      opt.poll ? {
        interval: opt.poll * 60 * 1000,
        binaryInterval: opt.poll * 60 * 1000
      } : {}
    )
  ).on('addDir', (file) => {
    const fileDepth = file.split(sep).length
    if (
      fileDepth === depth ||
      fileDepth - depth > opt.downloadsDepth
    ) return
    log.debug('detected change', file)
    queue({ path: file }, opt)
  })
}

async function runLog (opt) {
  const release = await getLog(opt.release)
  if (!release) return log.error('couldnt find matching release')
  if (!release.logs.length) return log.error('no log entries for release')
  release.logs.forEach((entry) => {
    const level = logLevels[entry.level]
    const meta = {
      module: entry.module,
      meta: entry.meta
    }
    log[level](meta, entry.msg)
  })
}

async function runDir (opt) {
  log.info(`run on dir containing: ${opt.release}`)
  const dirs = await listDirs(opt.downloadsPath, opt.depth)
  const re = new RegExp(opt.release, 'i')
  const path = dirs.find((dir) => re.test(dir))
  const worker = new Undisco(path, opt)
  await worker.run()
}

async function runUsage (opt) {
  usage()
}

/**
 * globally scoped workers for queue fn
 * @type {Array}
 */
const workers = []
/**
 * indicator for queue, whether processing in progress
 * @type {Boolean}
 */
let working = false
/**
 * simple in house async promise queueing
 * @param  {String|Array} dirs directories to process
 * @param  {Object} opt  Undisco options
 */
async function queue (dirs, opt) {
  dirs = [].concat(dirs)
  workers.push(...dirs.map((dir) => new Undisco(dir.path, opt)))
  if (working) return
  working = true
  while (workers.length) {
    await workers.shift().run()
  }
  working = false
}

// only run if called (not impoted)
if (!module.parent) {
  (async function () {
    fontAscii('undisco', { typeface: 'SmallSlant', color: 'blue' })
    try {
      undisco(await options())
    } catch (err) {
      log.error({meta: err}, err.message)
    }
  })()
}

export default undisco
