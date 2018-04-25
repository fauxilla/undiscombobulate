import {
  parse
} from 'path'

export default function parseName ({ meta, logger }) {
  const log = logger('parseName')
  if (meta.imdbId) {
    log('have imdb id, no need to parse name')
    return
  }
  let name = parse(meta.srcRootDir).base
    .replace(/\./g, ' ')
    .replace(/[-()_!+]/g, '')
  const seasonEpisode = /S(\d{2})E(\d{2})/.exec(name)
  if (seasonEpisode) {
    name = name.slice(0, seasonEpisode.index - 1)
    meta.parsedName = {
      type: 'tv',
      name,
      season: seasonEpisode[1],
      episode: seasonEpisode[2]
    }
    return
  }
  const year = /(19|20)\d{2}/.exec(name)
  if (year) {
    name = name.slice(0, year.index - 1)
    meta.parsedName = {
      type: 'movie',
      name,
      year: year[0]
    }
    return
  }
  throw new Error('no imdb id & no parsed name')
}
