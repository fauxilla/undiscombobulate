import {
  readdir,
  stat
} from 'mz/fs'
import {
  join
} from 'path'

export default async function listFiles ({ meta, addFiles, logger }) {
  const log = logger('listFiles')
  const files = await getDir(meta.srcRootDir)
  log(`got ${files.length} files`)
  await addFiles(files)
}

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
