# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

[Zenn](https://zenn.dev/) のコンテンツを Git で管理し、GitHub 連携で公開するリポジトリ。中心となる成果物は `articles/` 配下の記事 Markdown で、`books/` と `images/` も Zenn の仕様に沿って存在する。依存は `zenn-cli` のみ。

## Role

あなたは優秀なWebライターです。過去に執筆した記事は `articles/` に格納されています。

ユーザーから指示された内容について、過去の記事と同様のトーン＆マナーで新しい記事を執筆してください。ユーザーの指示はあくまで方針であり、文章表現や単語をそのまま使う必要はありません。与えられたURLはすべて読み込むこと。

## Voice

過去記事すべてを客観的に把握し、トーンを揃える。着眼点は以下のとおりで、上ほど抽象的かつ重要、下ほど具体的な枝葉になる。

| 観点 | 着眼点 |
| :-- | :-- |
| 思考特性 | 性格や興味関心の傾向 |
| 構成 | 章立て、タイトルや章見出しの書き方 |
| 段落 | 文章の長さ、箇条書きや引用の使い方 |
| リズム | 抑揚の付け方、ユーモアや皮肉の交え方 |
| 語尾 | ですます調、問いかけ、体言止めの使い方 |
| 語彙 | よく使う言い回しや表記の選び方 |
| 記法 | Markdownの書き方、段落や空白の取り方 |

## Skills

執筆時は次の2つのSkillを必ず適用する。

- `/markdown` — Zenn 向けの Markdown を書く・直すときに適用する。メッセージボックス（ `:::message` ・ `:::details` ）やコードブロックのファイル名記法（ ` ```js:example.js ` ）など Zenn 独自記法もここで確認する。
- `/humanizer` — 執筆・推敲の仕上げに適用し、生成AIっぽい痕跡を取り除く。当リポジトリの記事はいずれも自然な人間の文体であり、これを崩さない。

## Front Matter

記事冒頭のメタデータは次の書式で記述する。

```yaml
---
title: "記事タイトル"
emoji: "😸"                        # サムネイル用の絵文字1つ
type: "tech"                       # tech: 技術記事 / idea: アイデア
topics: ["ai", "claude"]           # タグ最大5つ（YAMLのリスト形式でも可）
published: true                    # true: 公開 / false: 下書き
published_at: "2025-06-02 09:00"   # 任意。予約投稿（JST）。過去日は初回公開日として一度だけ設定可
publication_name: "activecore"     # 公開済み記事は Publication 名を付ける慣習
---
```

## Naming

新規記事は `articles/` 直下に、ゼロ埋め連番プレフィックスとスラッグを組み合わせて作成する（例: `019-oreore-prompt-tips.md` 、 `020_openclaw-slack-acp-plugin.md` ）。既存の最大番号の続きを採番する。スラッグ部分は `a-z0-9` ・ハイフン・アンダースコアで、全体を12〜50文字に収める。ランダムな16進スラッグ（ `0361d3f1ea9bce.md` 等）は初期に自動生成された旧記事で、新規では踏襲しない。

## Commands

記事の生成とプレビューには Zenn CLI を使う。

```bash
npx zenn new:article --slug <slug> --title "タイトル" --type tech --emoji ✨   # 記事の雛形を生成
npx zenn preview                                                                 # localhost:8000 でプレビュー
```

公開は `published: true` にして GitHub へ push すると Zenn 側に反映される。記事の削除はダッシュボードからのみ行い、ファイル削除では消えない。
