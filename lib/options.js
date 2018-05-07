import hjson from 'hjson'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import {
  readFile
} from 'mz/fs'

async function options () {
  let opt
  try {
    opt = hjson.parse(await readFile('./config.hjson', 'utf8'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
    console.log(`You don't seem to have a config file.`)
    return
  }

  if (['once', 'watch', 'dir', 'log'].includes(process.argv[2])) {
    opt.command = process.argv[2]
  } else {
    opt.command = 'usage'
  }
  let args = commandLineArgs(
    [
      { name: 'once', alias: 'o', type: Boolean },
      { name: 'dump', alias: 'd', type: Boolean },
      { name: 'force', alias: 'f', type: Boolean },
      { name: 'release', alias: 'r', type: String },
      { name: 'verbose', alias: 'v', type: Boolean }
    ],
    {
      argv: process.argv.slice(3)
    }
  )

  if (args['release']) opt.release = args.release
  if (args['dump']) {
    opt.dump = Object.assign(
      {},
      opt.dump,
      { writeDump: args['dump'] }
    )
  }
  if (args['force']) {
    opt.done = Object.assign(
      {},
      opt.done,
      { force: args['force'] }
    )
  }
  if (args['verbose']) {
    opt.verbose = true
  }

  return opt
}

function usage () {
  console.log(commandLineUsage([
    {
      header: 'undiscombobulate',
      content: 'Extensible post processing for movies & tv'
    },
    {
      header: 'Synopsis',
      content: '$ undisco <command> <options>'
    },
    {
      header: 'Commands',
      content: [
        { name: 'watch', summary: 'Monitor for changes.' },
        { name: 'once', summary: 'Iterate over folders once.' },
        { name: 'dir', summary: 'Process specific directory.' },
        { name: 'log', summary: 'Show logs' }
      ]
    }
  ]))
}

export { options, usage }
