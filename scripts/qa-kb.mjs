import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, normalize, relative, resolve } from 'node:path'

const root = resolve('kb')
const forbidden = ['cfat_', '/Users/arnab', '.omo', 'graphify-out']
const files = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path)
    } else if (extname(path) === '.md') {
      files.push(path)
    }
  }
}

function pageExists(target) {
  const withoutHash = target.split('#')[0]
  if (!withoutHash || withoutHash.startsWith('http') || withoutHash.startsWith('mailto:')) {
    return true
  }
  if (isAbsolute(withoutHash) && withoutHash.startsWith(root)) {
    return existsSync(`${withoutHash}.md`) || existsSync(withoutHash) || existsSync(join(withoutHash, 'index.md'))
  }
  if (withoutHash.startsWith('/')) {
    const absolute = join(root, withoutHash)
    return existsSync(`${absolute}.md`) || existsSync(join(absolute, 'index.md'))
  }
  return existsSync(`${withoutHash}.md`) || existsSync(withoutHash) || existsSync(join(withoutHash, 'index.md'))
}

walk(root)

const failures = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const needle of forbidden) {
    if (text.includes(needle)) {
      failures.push(`${relative(root, file)} contains forbidden string ${needle}`)
    }
  }
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1].replace(/^<|>$/g, '')
    if (/\.(png|jpe?g|gif|svg|webp|avif|pdf)$/i.test(href)) {
      continue
    }
    const candidate = href.startsWith('/') ? href : normalize(join(file, '..', href))
    if (!pageExists(candidate)) {
      failures.push(`${relative(root, file)} links to missing page ${href}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`Checked ${files.length} Markdown files`)
