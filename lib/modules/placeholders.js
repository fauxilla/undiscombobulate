import {
  get as _get
} from 'lodash'

export default function placeholders ({ meta, logger }) {
  // eslint-disable-next-line no-unused-vars
  const log = logger('placeholders')
  const get = (path, def) => _get(meta, path, def)
  meta.placeholders = {
    title: (
      get('tmdb.original_title') ||
      get('tmdb.original_name') ||
      'no-title'
    ),
    S: get('parsedName.season', '').replace(/^0/, ''),
    SS: get('parsedName.season', ''),
    E: get('parsedName.episode', '').replace(/^0/, ''),
    EE: get('parsedName.episode', ''),
    rating: get('tmdb.vote_average') || '0',
    year: get('tmdb.release_date', 'year').slice(0, 4)
  }
}
