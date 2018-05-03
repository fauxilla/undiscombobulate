import {
  createClient,
  Client
} from 'flashheart'
import {
  promisify
} from 'util'
import format from 'string-template'

const client = createClient()
client.get = promisify(Client.prototype.get)

const defaults = {
  pushbullet: {
    accessToken: false
  }
}

export default async function pushbullet ({ meta, logger, opt }) {
  opt = Object.assign(defaults, opt.notifications)
  if (!opt.pushbullet.accessToken) throw new Error('need token to pushbullet')
  let body
  if (
    (meta.parsedName.mediaClass === 'tv') &&
    (meta.parsedName.episode !== 'multi')
  ) {
    body = format('Got Episode: {title} S{SS}E{EE}', meta.placeholders)
  } else if (meta.parsedName.mediaClass === 'tv') {
    body = format('Got Season: {title} Season {S}', meta.placeholders)
  } else if (meta.parsedName.mediaClass === 'movie') {
    body = format('Got Movie: {title} ({year})', meta.placeholders)
  } else {
    log(meta)
    throw new Error('couldnt determine mediaClass')
  }
  const log = logger('pushbullet')
  const endpoint = 'https://api.pushbullet.com/v2/pushes'
  const reqOptions = {
    headers: {
      'Access-Token': opt.pushbullet.accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'undiscombobulate',
      body,
      type: 'note'
    })
  }
  try {
    await client.get(endpoint, reqOptions)
  } catch (e) { throw e }
  log('sent pushbullet notification')
}
