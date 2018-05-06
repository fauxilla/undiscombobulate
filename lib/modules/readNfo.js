import {
  readFile
} from 'mz/fs'

export default async function readNfo ({ meta, getLog }) {
  const { debug } = getLog('readNfo')
  const nfo = meta.files.find((file) => file.role === 'nfo')
  if (!nfo) return debug('no nfo file')
  meta.nfoContent = await readFile(nfo.path, 'utf8').catch(e => { throw e })
  const matches = meta.nfoContent.match(/tt\d{7}/)
  if (matches) {
    meta.imdbId = matches[0]
    debug(`got imdbId: ${meta.imdbId}`)
  } else {
    debug('no imdbId in nfo')
  }
}
