#!/usr/bin/env node
import 'babel-polyfill'
import Undisco from './Undisco'
import readDir from './readDir'
import fontAscii from 'font-ascii'
import {
  watch
} from 'chokidar'
import options from './options'
import {
  sep
} from 'path'
import bunyan from 'bunyan'
import {
  LogStdOut
} from './log'

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
  const depth = opt.downloadsPath.split(sep).length
  if (opt.once) {
    log.debug(`run once on ${opt.downloadsPath}`)
    let dirs
    try {
      dirs = await readDir(opt.downloadsPath, { files: false })
    } catch (e) {
      throw new Error(`bad path: ${opt.downloadsPath}`)
    }
    log.debug(`${dirs.length} entries in ${opt.downloadsPath}`)
    const dump = []
    const workers = dirs.map((dir) => new Undisco(dir.path, opt))
    while (workers.length) {
      dump.push(await workers.shift().run())
    }
    return dump
  }
  if (watch || opt.poll) {
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
    } catch (e) {
      console.log(e.message)
      log.error(e)
    }
  })()
}

export default undisco
