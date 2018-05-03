import Unrar from 'unrar'

const defaults = {
  tempDir: '/tmp'
}

export default async function unrar ({ meta, addFiles, logger, opt }) {
  opt = Object.assign(defaults, opt)
  const log = logger('unrar')
  const archiveFile = meta.files.find((file) => file.role === 'archive')
  if (!archiveFile) return
  await new Promise((resolve, reject) => {
    const archive = new Unrar(archiveFile.path)
    archive.list(async (e, entries) => {
      if (e) return reject(e)
      await addFiles(entries.map((entry) => ({
        path: entry.name,
        contents: archive.stream(entry.name),
        size: entry.size
      })))
      log(`extracted ${entries.length} file(s) from ${archiveFile.path}`)
      resolve()
    })
  })
}
