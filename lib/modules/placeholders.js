import {
  get
} from 'lodash'

export default function placeholders ({ meta, logger }) {
  // eslint-disable-next-line no-unused-vars
  const log = logger('placeholders')
  meta.placeholders = {
    title: (
      get(meta, 'tmdb.original_title') ||
      get(meta, 'tmdb.original_name') ||
      'no-title'
    ),
    rating: get(meta, 'tmdb.vote_average') || '0',
    year: get(meta, 'tmdb.release_date', 'year').slice(0, 4),
    S: get(meta, 'parsedName.season', '').replace(/^0/, ''),
    SS: get(meta, 'parsedName.season', '')
  }

  meta.files.forEach((file) => {
    if (!file.parsedName) return
    Object.assign(
      file,
      {
        E: get(file, 'parsedName.episode', '').replace(/^0/, ''),
        EE: get(file, 'parsedName.episode', '')
      }
    )
  })
}
