import readDir from '../readDir'

const defaults = {
  retryAfter: 1,
  types: {
    sample: [
      '*sample*'
    ],
    archive: [
      '*.rar'
    ],
    feature: [
      '*.avi',
      '*.mkv',
      '*.wmv',
      '*.mp4',
      '!*sample*'
    ],
    subtitles: [
      '*.sub',
      '*.srt',
      '*.sbv',
      '*.sfv'
    ],
    nfo: [
      '*.nfo'
    ],
    dump: [
      'undisco.dump'
    ]
  }
}

export default async function listFiles ({ meta, logger, opt }) {
  opt = Object.assign(defaults, opt)
  meta.files = await readDir(
    meta.srcRootDir,
    { dirs: false, types: opt.types }
  )
}
