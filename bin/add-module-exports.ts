import fs from 'fs'
import path from 'path'
import util from 'util'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

async function main(): Promise<void> {
  const indexFile = path.resolve(__dirname, '..', 'src', 'index.js')
  let contents = await readFile(indexFile, 'utf8')
  // Find the right exports.default (skip "void 0")
  contents = contents.replace(/exports\.default = ([^ ;]+);/, 'exports.default = $1;\nmodule.exports = $1;')
  await writeFile(indexFile, contents, 'utf8')
  process.exit(0)
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
