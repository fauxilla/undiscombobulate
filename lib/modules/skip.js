/**
 * skip releases which don't seem to contain video
 * @param  {Object} meta
 * @param  {Function} logger
 * @param  {Object} opt
 */
export default async function skip ({ meta, logger, opt }) {
  const log = logger('skip')

  if (!meta.files.find((file) => ['feature', 'archive'].includes(file.role))) {
    log(`no video in this directory, will skip`)
    throw new Error('skip')
  }
}
