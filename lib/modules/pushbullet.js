import {
  createClient,
  Client
} from 'flashheart'
import {
  promisify
} from 'util'
import format from 'string-template'

const client = createClient()
// async function get(url, options) {
//   return new Promise((resolve, reject) => {
//     client.get(url, options, () => {
//
//     })
//   })
// })
client.get = promisify(Client.prototype.get)
client.post = promisify(Client.prototype.post)

const defaults = {
  pushbullet: {
    accessToken: false
  }
}

export default async function pushbullet ({ meta, logger, opt }) {
  opt = Object.assign(defaults, opt.notifications)
  // fail silently
  if (!opt.pushbullet.accessToken) return
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
  try {
    await client.post(
      endpoint,
      {
        title: 'undiscombobulate',
        body,
        type: 'note'
      },
      {
        headers: {
          'Access-Token': opt.pushbullet.accessToken
        },
        json: true
      }
    )
  } catch (e) {
    log(Object.keys(e))
    log(e.body)
    log(e.headers)
    throw e
  }
  log('sent pushbullet notification')
}
