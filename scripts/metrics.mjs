#!/usr/bin/env node
// 記事の地の文（見出し・コード・表・リスト・引用・キャプションを除く本文）から
// 文体の定量指標を測り、VOICE.md の Metrics にそのまま貼れる表を出力する。
// 使い方: node scripts/metrics.mjs <記事.md ...>  複数渡すと平均と範囲を出す。
import { readFileSync } from 'node:fs'

const ENDINGS = [
  'んですよね', 'ですよね', 'ですかね', 'ですね', 'でしょうか', 'でしょう',
  'ましょうか', 'ましょう', 'ませんか', 'ません', 'ますか', 'ますね', 'ました',
  'ます', 'でしたか', 'でした', 'ですか', 'です', 'ください', 'たい',
]

function extractParagraphs(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
  const paragraphs = []
  let buffer = []
  let inCode = false
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('```')) { inCode = !inCode; continue }
    const excluded = inCode || /^(#|\||:::|>|[-*] |\d+\. |!\[|\[\^|\*[^*])/.test(line)
    if (line === '' || excluded) {
      if (buffer.length > 0) paragraphs.push(buffer.join(''))
      buffer = []
      continue
    }
    buffer.push(line)
  }
  if (buffer.length > 0) paragraphs.push(buffer.join(''))
  return paragraphs.map((p) =>
    p
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[\^\d+\]/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*~]/g, '')
      .trim(),
  ).filter((p) => p.length > 0)
}

function classifyEnding(sentence) {
  const tail = sentence
    .replace(/[。！？!?\s]+$/u, '')
    .replace(/[）」』]+$/u, '')
    .replace(/\p{Extended_Pictographic}+$/u, '')
  for (const ending of ENDINGS) if (tail.endsWith(ending)) return ending
  return 'その他'
}

function measure(path) {
  const paragraphs = extractParagraphs(readFileSync(path, 'utf8'))
  const sentences = paragraphs.flatMap((p) => p.match(/[^。！？]+[。！？]+|[^。！？]+$/gu) ?? [])
  const chars = (s) => s.replace(/\s/g, '').length
  const count = (s, re) => (s.match(re) ?? []).length
  const text = paragraphs.join('')
  return {
    articleChars: chars(text),
    sentenceCount: sentences.length,
    sentenceChars: sentences.reduce((sum, s) => sum + chars(s), 0),
    paragraphCount: paragraphs.length,
    commas: count(text, /、/g),
    emojis: count(text, /\p{Extended_Pictographic}/gu),
    exclamations: count(text, /[！？!?]/g),
    endings: sentences.map(classifyEnding),
  }
}

const paths = process.argv.slice(2)
if (paths.length === 0) {
  console.error('使い方: node scripts/metrics.mjs <記事.md ...>')
  process.exit(1)
}

const results = paths.map(measure)
const sum = (key) => results.reduce((total, r) => total + r[key], 0)
const mean = (key) => sum(key) / results.length
const range = (key) => {
  const values = results.map((r) => r[key])
  return `\`${Math.round(Math.min(...values))}\` 〜 \`${Math.round(Math.max(...values))}\` 字`
}

const totalSentences = sum('sentenceCount')
const endingCounts = new Map()
for (const r of results) for (const e of r.endings) endingCounts.set(e, (endingCounts.get(e) ?? 0) + 1)
const endingSummary = [...endingCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6)
  .map(([ending, n]) => `${ending} \`${Math.round((n / totalSentences) * 100)}\`%`)
  .join(' ・ ')

const scope = results.length > 1 ? `直近${results.length}本` : '草稿'
console.log(`| 指標 | ${scope}の値 |`)
console.log('| :-- | :-- |')
console.log(`| 記事の長さ | 平均 \`${Math.round(mean('articleChars'))}\` 字${results.length > 1 ? `（${range('articleChars')}）` : ''} |`)
console.log(`| 一文の長さ | 平均 \`${Math.round(sum('sentenceChars') / totalSentences)}\` 字 |`)
console.log(`| 段落の長さ | 平均 \`${Math.round(sum('articleChars') / sum('paragraphCount'))}\` 字 |`)
console.log(`| 読点の頻度 | 一文あたり \`${(sum('commas') / totalSentences).toFixed(1)}\` 個 |`)
console.log(`| 文末の分布 | ${endingSummary} |`)
console.log(`| 絵文字の頻度 | 1記事あたり \`${mean('emojis').toFixed(1)}\` 個 |`)
console.log(`| ！？の頻度 | 1記事あたり \`${mean('exclamations').toFixed(1)}\` 個 |`)
