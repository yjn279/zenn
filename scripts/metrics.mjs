#!/usr/bin/env node
// 記事の地の文（見出し・コード・表・リスト・引用・画像・埋め込みを除いた本文）から
// 文体の定量指標を測り、VOICE.md の Metrics にそのまま貼れる表を出力する。
// 使い方: node scripts/metrics.mjs <記事.md ...>  複数渡すと平均と範囲を出す。
import { readFileSync } from 'node:fs'

// ですます調の語尾は、助動詞と終助詞の組み合わせで尽きる。列挙せず掛け合わせで作る。
const AUXILIARIES = [
  'です', 'んです', 'でした', 'んでした', 'でしょう',
  'ます', 'ました', 'ません', 'ませんでした', 'ましょう',
  'ください', 'たい',
]
const PARTICLES = ['', 'か', 'ね', 'よ', 'かね', 'よね']
const ENDINGS = AUXILIARIES
  .flatMap((auxiliary) => PARTICLES.map((particle) => auxiliary + particle))
  .sort((a, b) => b.length - a.length)

// 絵文字1つ分。異体字セレクタ・肌色・ZWJ 連結・国旗をまとめて1つとして扱う。
const EMOJI = /(?:\p{RI}\p{RI}|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️)?)*)/gu
// 文の終止符。閉じ括弧・引用符・絵文字は終止符のあとに続くことがある。
const TERMINATOR = new RegExp(`[。！？]+(?:[)）」』】〉》\\]"'…]|${EMOJI.source})*`, 'gu')
// 地の文ではない行。見出し・表・リスト・引用・画像・脚注・キャプション・Zenn の埋め込み。
const NOT_PROSE = /^(?:#|\||:::|>|[-*] |\d+\. |!\[|\[\^|\*[^*]|@|https?:\/\/\S+$)/

function extractParagraphs(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
  const paragraphs = []
  let buffer = []
  let inCode = false
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('```')) { inCode = !inCode; continue }
    if (line === '' || inCode || NOT_PROSE.test(line)) {
      if (buffer.length > 0) paragraphs.push(buffer.join(''))
      buffer = []
      continue
    }
    buffer.push(line)
  }
  if (buffer.length > 0) paragraphs.push(buffer.join(''))
  return paragraphs
    .map((p) => p
      .replace(/\[\^\d+\]/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*~]/g, '')
      .trim())
    .filter((p) => p.length > 0)
}

// 終止符で区切る。終止符を欠いたまま段落が終わる文（絵文字や閉じ括弧で締める形）も1文として拾う。
function splitSentences(paragraph) {
  const sentences = []
  let cursor = 0
  for (const match of paragraph.matchAll(TERMINATOR)) {
    const end = match.index + match[0].length
    sentences.push(paragraph.slice(cursor, end))
    cursor = end
  }
  const rest = paragraph.slice(cursor).trim()
  if (rest.length > 0) sentences.push(rest)
  return sentences
}

// 終止符と装飾を落とし、残った末尾から語尾を判定する。
function classifyEnding(sentence) {
  const tail = sentence
    .replace(new RegExp(`(?:[。！？\\s)）」』】〉》\\]"'…]|${EMOJI.source})+$`, 'u'), '')
  return ENDINGS.find((ending) => tail.endsWith(ending)) ?? '常体ほか'
}

function measure(path) {
  const paragraphs = extractParagraphs(readFileSync(path, 'utf8'))
  const sentences = paragraphs.flatMap(splitSentences)
  const chars = (s) => s.replace(/\s/g, '').length
  const count = (s, re) => [...s.matchAll(re)].length
  const text = paragraphs.join('')
  return {
    articleChars: chars(text),
    sentenceCount: sentences.length,
    sentenceChars: sentences.reduce((sum, s) => sum + chars(s), 0),
    paragraphCount: paragraphs.length,
    commas: count(text, /、/g),
    emojis: count(text, EMOJI),
    exclamations: count(text, /[！？]/g),
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
