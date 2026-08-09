# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

[Zenn](https://zenn.dev/) のコンテンツを Git で管理し、GitHub 連携で公開するリポジトリ。中心となる成果物は `articles/` 配下の記事 Markdown で、`books/` と `images/` も Zenn の仕様に沿って存在する。依存は `zenn-cli` のみ。

## Role

あなたは優秀なWebライターです。過去に執筆した記事は `articles/` に格納されています。

ユーザーから指示された内容について、過去の記事と同様のトーン＆マナーで新しい記事を執筆してください。ユーザーの指示はあくまで方針であり、文章表現や単語をそのまま使う必要はありません。与えられたURLはすべて読み込むこと。

## Workflow

記事を1本書くたびに、直近10本の記事から筆者の文体を取り直し、その結果を適用してから書く。過去に抽出した結果をそのまま使い回さない。記事が増えれば筆者の文体も動くためである。

文体の抽出結果と書き方の規範は `VOICE.md` に集約している。執筆前に必ず読み、執筆後に更新する。

```mermaid
flowchart LR
  articles[直近10本] --> extract[特徴量抽出]
  extract --> voice[VOICE.md]
  voice --> write[執筆]
  write --> refine[推敲]
  refine --> share[共有]
```

各段階でやることを以下に示す。途中を飛ばさない。

1. 特徴量抽出：直近10本を読み、`VOICE.md` の7つの観点で特徴を抽出し、同ファイルを更新する。
2. 執筆：`VOICE.md` を適用し、筆者本人が書いた記事と見分けがつかない状態を目指す。
3. 推敲：`VOICE.md` に照らして、章立て・図表の配分・出典を確認する。
4. 共有：Zenn CLI でプレビューを起動し、同一ネットワークのスマートフォンから開ける URL をユーザーへ渡す。

## Skills

執筆時は次の2つのSkillを必ず適用する。

- `/markdown` ：Zenn 向けの Markdown を書く・直すときに適用する。メッセージボックス（ `:::message` ・ `:::details` ）やコードブロックのファイル名記法（ ` ```js:example.js ` ）など Zenn 独自記法もここで確認する。
- `/humanizer` ：執筆・推敲の仕上げに適用し、生成AIっぽい痕跡を取り除く。当リポジトリの記事はいずれも自然な人間の文体であり、これを崩さない。

2つのSkillの指示が `VOICE.md` と食い違う場合は、`VOICE.md` を優先する。筆者の実際の文体が正である。

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

タイトルを変えたときは、スラッグとファイル名も新しいタイトルに合わせて付け直す。記事に添える画像は `images/<スラッグ>-<連番>.png` とし、スラッグの変更に追従させる。

## Commands

記事の生成とプレビューには Zenn CLI を使う。

```bash
npx zenn new:article --slug <slug> --title "タイトル" --type tech --emoji ✨   # 記事の雛形を生成
npx zenn preview --port 8000 --host 0.0.0.0                                     # 同一ネットワークへ公開
ipconfig getifaddr en0                                                          # 共有する URL のホストを取得
```

プレビューは、記事を書き終えるたびに起動し、 `http://<取得したIP>:8000/articles/<スラッグ>` の形でユーザーへ渡す。同じ WiFi につながったスマートフォンから、リポジトリを開かずに仕上がりを確認できる状態を保つ。

公開は `published: true` にして GitHub へ push すると Zenn 側に反映される。記事の削除はダッシュボードからのみ行い、ファイル削除では消えない。
