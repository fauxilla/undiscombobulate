export default function parseFileNames ({ meta, getLog }) {
  // eslint-disable-next-line no-unused-vars
  const { debug } = getLog('parseFileNames')

  meta.files.forEach((file) => {
    let name = file.base
      .replace(/\./g, ' ')
      .replace(/[-()_!+]/g, '')
    const seasonEpisode = /S(\d{2})E(\d{2})/i.exec(name)
    /*
     * for seasons, the season/ep needs to be written to both the root meta,
     * and to each file, in case there are many episode files in the release.
     * when resolving placeholders, ep numbers on files take precedence over
     * those in the root meta
     */
    if (seasonEpisode) {
      name = name.slice(0, seasonEpisode.index - 1)
      // find a better way to do this, it seems sloppy. Detect whether a release
      // has multiple episodes, if so, only write season to root meta.
      if (meta.parsedName && meta.parsedName.episode !== seasonEpisode[2]) {
        meta.parsedName.episode = 'multi'
      } else if (!meta.parsedName) {
        meta.parsedName = {
          mediaClass: 'tv',
          name,
          season: seasonEpisode[1],
          episode: seasonEpisode[2]
        }
      }
      file.parsedName = {
        episode: seasonEpisode[2]
      }
      return
    }
    const year = /(19|20)\d{2}/.exec(name)
    if (year) {
      name = name.slice(0, year.index - 1)
      if (!meta.parsedName) {
        meta.parsedName = {
          mediaClass: 'movie',
          name,
          year: year[0]
        }
      }
      return
    }
  })
}
