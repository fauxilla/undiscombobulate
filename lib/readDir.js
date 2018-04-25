import {
  readdir,
  stat
} from 'mz/fs'
import {
  join,
  parse
} from 'path'
import multimatch from 'multimatch'

/**
 * simple dir parser, stats files, determines type
 * not recursive
 * @param  {String} root
 * @param  {Object} options
 * @return {Array}         files
 */
export default async function readDir (root, options) {
  const opt = Object.assign(
    {
      dirs: true,
      files: true,
      types: {}
    },
    options
  )
  let paths = await readdir(root)
    .then((paths) => paths.map((path) => join(root, path)))
    .catch(e => { throw e })
  let nodes = []
  while (paths.length) {
    const path = paths.pop()
    const parsedPath = parse(path)
    const node = await stat(path).catch(e => { throw e })
    if (!opt.dirs && node.isDirectory()) continue
    if (!opt.files && node.isFile()) continue
    nodes.push(Object.assign(
      parsedPath,
      {
        path,
        size: node.size,
        mtimeMs: node.mtimeMs,
        type: Object.keys(opt.types).find((type) => {
          return multimatch([ parsedPath.base ], opt.types[type]).length
        }) || 'no-type'
      }
    ))
  }
  return nodes
}
