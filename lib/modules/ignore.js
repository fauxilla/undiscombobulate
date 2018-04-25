export default function ignore ({ meta }) {
  meta.files = meta.files.filter((file) => {
    return ['feature', 'subtitles'].includes(file.type)
  })
}
