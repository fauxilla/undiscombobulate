import {
  remove
} from 'fs-extra'
import {
  promisify
} from 'util'

export default async function clean ({ meta }) {
  if (meta.tempPath) await promisify(remove)(meta.tempPath)
}
