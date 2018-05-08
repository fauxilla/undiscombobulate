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
  parse
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
  log.level(opt.logLevel)
  const commands = {
    log: runLog,
    watch: runWatch,
    once: runOnce,
    dir: runDir,
    usage: runUsage
  }
  return await commands[opt.command](opt)
}

async function runOnce (opt) {
  log.info(`run once on ${opt.path}`)
  const dirs = await listDirs(opt.path, opt.depth)
  log.debug(`${dirs.length} entries in ${opt.path}`)
  const workers = dirs.map((dir) => new Undisco(dir, opt))
  const dump = []
  while (workers.length) dump.push(await workers.shift().run())
  return dump
}

async function runWatch (opt) {
  if (opt.watch) log.info(`watching ${opt.path}`)
  else log.info(`polling ${opt.path} every ${opt.poll} minutes.`)

  const timeouts = {}

  watch(
    opt.path,
    {
      persistent: true,
      usePolling: !opt.watch,
      interval: opt.poll * 60 * 1000,
      binaryInterval: opt.poll * 60 * 1000,
      ignoreInitial: true,
      depth: opt.depth
    }
  )
  .on('change', (path, stat) => {
    const dir = parse(path).dir
    // debounce changeHandler
    if (timeouts[dir]) clearTimeout(timeouts[dir])
    timeouts[dir] = setTimeout(() => changeHandler(dir, stat), 5000)
  })

  function changeHandler (dir, stat) {
    delete timeouts[dir]
    if (stat.isDirectory()) return
    log.debug(`detected change: ${dir}`)
    queue({ path: dir }, opt)
  }
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
  const dirs = await listDirs(opt.path, opt.depth)
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
