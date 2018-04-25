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
    // iterate over `downloadsPath` once & exit
    let dirs
    try {
      dirs = await readDir(opt.downloadsPath, { files: false })
    } catch (e) {
      throw new Error(`bad path: ${opt.downloadsPath}`)
    }
    dbg(`${dirs.length} entries in ${opt.downloadsPath}`)
    return await series(dirs, opt)
  } else if (opt.poll) {
    // poll `downloadsPath`
    while (true) {
      let dirs
      dirs = await readDir(opt.downloadsPath, { files: false })
      .catch(e => { throw e })
      dbg(`${dirs.length} entries in ${opt.downloadsPath}`)
      await series(dirs, opt)
      dbg(`waiting ${opt.poll} minutes for next poll`)
      await new Promise((resolve) => setTimeout(resolve, opt.poll * 60 * 1000))
    }
  } else if (watch) {
    // watch `downloadsPath`
    console.log(`watching ${opt.downloadsPath}`)
    watch(
      opt.downloadsPath,
      {
        depth: 0
      }
    ).on('addDir', (file) => {
      dbg('detected change', file)
      series({ path: file }, opt)
    })
  }
}

/**
 * async series iterator for directories
 * @param  {Array} dirs
 * @param  {Object} opt
 * @return {Object}      array of dumps from directories
 */
async function series (dirs, opt) {
  dirs = [].concat(dirs)
  const workers = dirs.map((dir) => new Undisco(dir.path, opt))
  const dump = []
  while (workers.length) dump.push(await workers.pop().run())
  return dump
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
