import {
  readdir,
  stat
} from 'mz/fs'
import {
  join
} from 'path'

export default async function listFiles ({ meta, addFiles, getLog }) {
  const { info } = getLog('listFiles')
  const files = await getDir(meta.srcRootDir)
  info(`got ${files.length} files from ${meta.srcRootDir}`)
  // addFiles usually stats & parses, but in this case will have the stats
  // already, so it will merely parse paths and push to the `meta.files`
  // structure
  await addFiles(files)
}

/**
 * recursive read files, returns full paths from root calls itself on subdirs
 * better to implement a specific getDir fn here, rather than having a
 * one-fits-all approach with too many options.
 * @param  {String} path root dir
 * @return {Array}      array of stats with path
 */
async function getDir (path) {
  let files = []
  let nodes = await readdir(path)
  nodes = nodes.map((node) => join(path, node))
  while (nodes.length) {
    const node = nodes.shift()
    const stats = await stat(node)
    if (stats.isDirectory()) files = files.concat(await getDir(node))
    else files.push(Object.assign({}, stats, { path: node }))
  }
  return files
}
