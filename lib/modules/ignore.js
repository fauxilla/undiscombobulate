export default function ignore ({ meta, getLog }) {
  const { info } = getLog('ignore')
  const count = meta.files.length
  meta.files = meta.files.filter((file) => {
    return ['feature', 'subtitles'].includes(file.role)
  })
  info(`filtered ${count - meta.files.length} junk files`)
}
