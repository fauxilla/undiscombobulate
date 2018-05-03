export default function ignore ({ meta, logger }) {
  const log = logger('ignore')
  const count = meta.files.length
  meta.files = meta.files.filter((file) => {
    return ['feature', 'subtitles'].includes(file.role)
  })
  log(`filtered ${count - meta.files.length} junk files`)
}
