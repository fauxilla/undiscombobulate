import {
  readFile
} from 'mz/fs'

export default async function readNfo ({ meta, logger }) {
  const log = logger('readNfo')
  const nfo = meta.files.find((file) => file.type === 'nfo')
  if (!nfo) return log('no nfo file')
  meta.nfoContent = await readFile(nfo.path, 'utf8').catch(e => { throw e })
  const matches = meta.nfoContent.match(/tt\d{7}/)
  if (matches) {
    meta.imdbId = matches[0]
    log(`got imdbId: ${meta.imdbId}`)
  } else {
    log('no imdbId in nfo')
  }
}
