import {
  writeFile
} from 'mz/fs'
import {
  join
} from 'path'
import {
  stringify
} from 'hjson'
// import format from 'string-template'
import prettyBytes from 'pretty-bytes'

const defaults = {
  writeDump: true
}

/**
 * bundles useful info about the process, writes to folder
 * @param  {Object} meta
 * @param  {Array} logs
 * @param  {Object} opt
 * @return {Object}      dump
 */
export default async function dump ({ meta, logs, opt }) {
  opt = Object.assign(defaults, opt.dump)
  let path = join(meta.srcRootDir, 'undisco.dump')
  const dump = Object.assign(
    {},
    meta,
    {
      files: meta.files.map((file) => ({
        size: prettyBytes(file.size),
        path: file.path,
        destPath: file.destPath,
        type: file.type
      })),
      nfoContent: '--- truncated ---',
      config: '--- truncated ---',
      logs
    }
  )
  if (!opt.writeDump) return dump
  let output
  try {
    output = stringify(dump)
  } catch (e) { throw e }
  await writeFile(path, output, 'utf8')
    .catch(e => {
      console.log(`couldn't write logfile: ${path}`)
      console.log(e.name)
      console.log(e.message)
      console.log(e.stack)
    })
  return dump
}
