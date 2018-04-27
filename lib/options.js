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
    { name: 'no-dump', alias: 'n', type: Boolean },
    { name: 'ignore-dump', alias: 'i', type: Boolean }
  ])
  if (args.once) opt.once = true
  if (args['no-dump']) {
    opt.dump = Object.assign(
      {},
      opt.dump,
      { writeDump: false }
    )
  }
  if (args['ignore-dump']) {
    opt.skip = Object.assign(
      {},
      opt.skip,
      { ignoreDump: true }
    )
  }
}
