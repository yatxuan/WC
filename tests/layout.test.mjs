import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

test('desktop layout uses a wider container and responsive floor columns', () => {
  assert.match(css, /@media \(min-width: 760px\)/)
  assert.match(css, /\.page-shell\s*\{[\s\S]*width:\s*min\(calc\(100%\s*-\s*64px\),\s*960px\)/)
  assert.match(css, /\.floor-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)/)
  assert.match(css, /@media \(min-width: 1100px\)/)
  assert.match(css, /\.floor-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)/)
  assert.match(css, /@media \(max-width: 759px\)/)
  assert.match(css, /\.floor-list\s*\{[\s\S]*grid-template-columns:\s*1fr/)
})
