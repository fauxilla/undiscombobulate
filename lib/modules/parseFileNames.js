export default function parseFileNames ({ meta, logger }) {
  // eslint-disable-next-line no-unused-vars
  const log = logger('parseName')

  meta.files.forEach((file) => {
    let name = file.parsedPath.base
      .replace(/\./g, ' ')
      .replace(/[-()_!+]/g, '')
    const seasonEpisode = /S(\d{2})E(\d{2})/.exec(name)
    if (seasonEpisode) {
      name = name.slice(0, seasonEpisode.index - 1)
      file.parsedName = {
        mediaClass: 'tv',
        name,
        season: seasonEpisode[1],
        episode: seasonEpisode[2]
      }
      return
    }
    const year = /(19|20)\d{2}/.exec(name)
    if (year) {
      name = name.slice(0, year.index - 1)
      file.parsedName = {
        mediaClass: 'movie',
        name,
        year: year[0]
      }
      return
    }
  })
}