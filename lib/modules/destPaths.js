import format from 'string-template'
import {
  join
} from 'path'

const defaults = {
  archives: {
    tv: 'tv',
    movie: 'movies'
  },
  tv: {
    path: '{archive}/{title}/Season {S}/',
    nfo: '{base}',
    feature: '{title} S{SS}E{EE}{ext}',
    sample: '{title} S{SS}E{EE}-sample{ext}',
    subtitles: '{title} S{SS}E{EE}{ext}'
  },
  movie: {
    path: '{archive}/{title} ({year})',
    feature: '{title} ({year}){ext}',
    sample: '{title} (sample){ext}',
    subtitles: '{title} ({year}){ext}'
  }
}

export default async function destPaths ({ meta, logger, opt }) {
  // eslint-disable-next-line no-unused-vars
  const log = logger('destPaths')
  opt = Object.assign(defaults, opt.destPaths)
  meta.files.forEach((file) => {
    if (!file.type || file.type === 'no-type') return
    const context = Object.assign(
      {},
      file,
      meta.placeholders,
      { archive: opt.archives[meta.tmdb.type] }
    )
    if (!opt[meta.tmdb.type]) {
      log(meta)
      throw new Error(`bad tmdb type: ${meta.tmdb.type}`)
    }
      
    file.destPath = join(
      format(opt[meta.tmdb.type].path, context),
      format(opt[meta.tmdb.type][file.type], context)
    )
  })
}
