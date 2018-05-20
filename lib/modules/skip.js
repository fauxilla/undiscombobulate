/**
 * skip releases which don't seem to contain video
 * @param  {Object} meta
 * @param  {Function} getLog
 * @param  {Object} opt
 */
export default async function skip ({ meta, getLog, opt }) {
  const { debug } = getLog('skip')

  if (!meta.files.find((file) => ['feature', 'archive'].includes(file.role))) {
    debug(`no video in this directory, will skip`)
    throw new Error('no media files')
  }
}
