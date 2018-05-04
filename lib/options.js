import hjson from 'hjson'
import commandLineArgs from 'command-line-args'
import {
  readFile
} from 'mz/fs'

export default async function options () {
  let opt
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
    { name: 'dump', alias: 'd', type: Boolean },
    { name: 'redo', alias: 'r', type: Boolean },
    { name: 'verbose', alias: 'v', type: Boolean }
  ])
  if (args.once) opt.once = true
  if (args['dump']) {
    opt.dump = Object.assign(
      {},
      opt.dump,
      { writeDump: args['dump'] }
    )
  }
  if (args['redo']) {
    opt.done = Object.assign(
      {},
      opt.done,
      { redo: args['redo'] }
    )
  }
  if (args['verbose']) {
    opt.verbose = true
  }
  return opt
}
