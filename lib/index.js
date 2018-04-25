#!/usr/bin/env node
import 'babel-polyfill'
import Undisco from './Undisco'
import readDir from './readDir'
import hjson from 'hjson'
import fontAscii from 'font-ascii'
import {
  readFile
} from 'mz/fs'
import {
  watch
} from 'chokidar'

import debug from 'debug'
import commandLineArgs from 'command-line-args'

const dbg = debug('undisco')

/**
 * main controller, determines run mode & monitors
 * @param  {[type]} opt
 * @return {[type]}     returns dumps, only in `once` mode
 */
async function undisco (opt) {
  if (opt.once) {
    console.log(`run once on ${opt.downloadsPath}`)
    let dirs
    try {
      dirs = await readDir(opt.downloadsPath, { files: false })
    } catch (e) {
      throw new Error(`bad path: ${opt.downloadsPath}`)
    }
    dbg(`${dirs.length} entries in ${opt.downloadsPath}`)
    const dump = []
    const workers = dirs.map((dir) => new Undisco(dir.path, opt))
    while (workers.length) {
      dump.push(await workers.shift().run())
    }
    return dump
  }
  if (watch || opt.poll) {
    // watch `downloadsPath`
    console.log(`watching ${opt.downloadsPath}`)
    watch(
      opt.downloadsPath,
      Object.assign(
        {
          depth: 0,
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
      dbg('detected change', file)
      queue({ path: file }, opt)
    })
  }
}

const workers = []
let working = false
async function queue (dirs, opt) {
  dirs = [].concat(dirs)
  workers.push(...dirs.map((dir) => new Undisco(dir.path, opt)))
  if (working) return
  working = true
  dbg('start work')
  while (workers.length) {
    dbg('worker iterate')

    await workers.shift().run()
  }
  working = false
}

// only run if called (not impoted)
if (!module.parent) {
  (async function () {
    let opt
    fontAscii('undisco', { typeface: 'SmallSlant', color: 'blue' })
    try {
      opt = hjson.parse(await readFile('./config.hjson', 'utf8'))
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
      console.log(`You don't seem to have a config file.`)
      return
    }
    // rudimentary flags, only for things that help with testing
    let args = commandLineArgs([
      { name: 'once', alias: 'o', type: Boolean },
      { name: 'no-dump', alias: 'n', type: Boolean }
    ])
    if (args.once) opt.once = true
    if (args['no-dump']) opt.dump = { writeDump: false }
    try {
      undisco(opt)
    } catch (e) {
      console.log(e.message)
      dbg(e)
    }
  })()
}

export default undisco
