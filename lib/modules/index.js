import {
  join
} from 'path'
const standardModules = [
  'done',
  'listFiles',
  'skip',
  'unrar',
  'readNfo',
  'parseFileNames',
  'tmdb',
  // 'subs',
  'placeholders',
  'ignore',
  'destPaths',
  'copy',
  'clean'
  // 'pushbullet'
]

export default function getModules (opt) {
  const modules = opt.modules || standardModules
  return modules.map((modName) => {
    let module
    try {
      module = require(join(__dirname, modName)).default
    } catch (e) {
      console.log(`failed import: ${join(__dirname, modName)}`)
      try {
        module = require(modName).default
      } catch (e) {
        throw new Error(`couldn't find module: ${modName}`)
      }
    }
    return module
  })
}
