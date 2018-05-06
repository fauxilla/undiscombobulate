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

export default async function destPaths ({ meta, getLog, opt }) {
  // eslint-disable-next-line no-unused-vars
  const { warn } = getLog('destPaths')
  opt = Object.assign(defaults, opt.destPaths)
  meta.files.forEach((file) => {
    if (!file.role || file.role === 'junk') return
    const context = Object.assign(
      {},
      meta.placeholders,
      file,
      { archive: opt.archives[meta.tmdb.mediaClass] }
    )
    if (!opt[meta.tmdb.mediaClass]) {
      warn(meta)
      throw new Error(`bad tmdb type: ${meta.tmdb.mediaClass}`)
    }

    file.destPath = join(
      format(opt[meta.tmdb.mediaClass].path, context),
      format(opt[meta.tmdb.mediaClass][file.role], context)
    )
  })
}
