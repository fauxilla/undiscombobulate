import {
  createClient,
  Client
} from 'flashheart'
import {
  promisify
} from 'util'
import {
  stringify
} from 'querystring'

export default async function tmdb ({ meta, logger, opt }) {
  const log = logger('tmdb')
  if (!opt.tmdb || !opt.tmdb.apiKey) {
    throw new Error('must configure apiKey for tmdb')
  }
  const apiKey = opt.tmdb.apiKey

  if (meta.imdbId) {
    log('lookup by imdb id')
    meta.tmdb = await imdbId(meta.imdbId, apiKey)
      .catch(e => { throw e })
    return
  }
  if (!meta.parsedName) throw new Error('no imdb id and no parsed name')
  if (meta.parsedName.type === 'tv') {
    log('lookup tv ep by parsed name')
    meta.tmdb = await tv(meta.parsedName, apiKey)
      .catch(e => { throw e })
    return
  }
  if (meta.parsedName.type === 'movie') {
    log('lookup movie by parsed name')
    meta.tmdb = await movie(meta.parsedName, apiKey)
      .catch(e => { throw e })
    return
  }
  throw new Error(`tmdb, no id and bad type: ${meta.parsedName.type}`)
}

const client = createClient()
client.get = promisify(Client.prototype.get)

async function imdbId (id, apiKey) {
  const endpoint = 'https://api.themoviedb.org/3/find/'
  const query = stringify({
    api_key: apiKey,
    external_source: 'imdb_id'
  })
  const url = `${endpoint}${id}?${query}`
  let tmdb
  try {
    tmdb = await client.get(url)
  } catch (e) { throw e }
  if (tmdb.movie_results.length) {
    return Object.assign(
      tmdb.movie_results[0],
      { type: 'movie' }
    )
  }
  if (tmdb.tv_results.length) {
    return Object.assign(
      tmdb.tv_results[0],
      { type: 'tv' }
    )
  }
  throw new Error(`couldn't resolve imdb id ${id}`)
}
async function tv ({ name }, apiKey) {
  const endpoint = 'https://api.themoviedb.org/3/search/tv'
  const query = stringify({
    api_key: apiKey,
    query: name
  })
  const url = `${endpoint}?${query}`
  let tmdb
  try {
    tmdb = await client.get(url)
  } catch (e) { throw e }
  if (!tmdb.results.length) throw new Error(`no tmdb tv result: ${name}`)
  return Object.assign(
    tmdb.results[0],
    { type: 'tv' }
  )
}
async function movie ({name, year}, apiKey) {
  const endpoint = 'https://api.themoviedb.org/3/search/movie'
  const query = stringify({
    api_key: apiKey,
    query: name,
    year
  })
  const url = `${endpoint}?${query}`
  let tmdb
  try {
    tmdb = await client.get(url)
  } catch (e) { throw e }
  if (!tmdb.results.length) throw new Error(`no tmdb movie result: ${name}`)
  return Object.assign(
    tmdb.results[0],
    { type: 'movie' }
  )
}
