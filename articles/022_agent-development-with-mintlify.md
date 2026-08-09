---
title: "Mintlifyでエージェント開発時代の認知負荷を下げよう"
emoji: "🌿"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - "mintlify"
  - "markdown"
  - "documentation"
  - "docs"
  - "agent"
published: true
published_at: "2026-08-12 08:00"
publication_name: "activecore"
---

## はじめに

モダンなエージェント開発環境では、ハーネスエンジニアリングにより Pull Request の差分を 1 行ずつ追う機会がめっきり減りました。

https://zenn.dev/activecore/articles/021_trinity-harness-for-long-running-tasks
*自作のハーネス「Trinity」 [^1]*

代わりに増えたのが、Markdown を読んで仕様や実装を把握する時間です。ただ、Markdown では情報を負荷なくスッと受け取ることができないので、だんだんと読む気が消え失せていきますよね😇

という訳で、エージェントには Markdown に情報をまとめてもらいつつ、それを HTML に変換することで認知負荷を下げるアプローチを採用してみました。

```mermaid
flowchart LR
  agent[エージェント] -->|Markdown| mintlify[Mintlify]
  mintlify -->|HTML| human[人間]
```

そこで登場するのが、Markdown をおしゃれな HTML に変換してくれる Mintlify です🌿

https://mintlify.com

## Mintlify とは

Mintlify はざっくり言うと Docs as Code、つまりドキュメントを Markdown のままリポジトリで管理し、そのまま Web サイトとして公開するためのサービスです[^2]。

実際、Mintlify 自身のドキュメントもこの方式で作られています。リポジトリを開いても、置かれているのはただの Markdown です。

![リポジトリに置かれた Markdown](/images/022_agent-development-with-mintlify-01.png)
*mintlify/docs より引用 [^3]*

この Markdown を HTML に変換するための設定も、同じくコードとして記述されています。`docs.json` に色やナビゲーションを書いておくと、それがそのままサイトの見た目になる訳です。

![表示設定を書いた docs.json](/images/022_agent-development-with-mintlify-02.png)
*mintlify/docs より引用 [^3]*

つまり、中身も見た目も丸ごと Git の管理下に入ります。ブランチを切って直して、push すれば公開される。これらを Mintlify で表示するとこうなります。

![Mintlify が表示したページ](/images/022_agent-development-with-mintlify-03.png)
*Mintlify Documentation より引用 [^2]*

中身は 1 文字も変わっていません。それでも、スタイルに色やメリハリがついて、左の目次でドキュメント体系が俯瞰できるだけで、読み始めるまでのハードルがまるで違いますよね！

## Markdown は必要なのか？

最近は AI に HTML を出力させてレビューする話もよく耳にしますが、Markdown を使わずに直接 HTML を生成するアプローチはどうでしょうか？

この方法は、個人的にはベストプラクティスではないと考えています。

なぜなら、生成のたび、少なからずデザインに揺れが生じるので、仕様を知りたいだけにも関わらずレイアウトを読み解くところから始めることになるからです。

おまけに、タグやスタイルという本質と関係のない情報がコンテキストに混ざるので、AI の精度が落ち、トークンも余計にかかります。

| 生成物 | コンテキスト | デザイン | 認知負荷 |
| :-- | :-- | :-- | :-- |
| HTML | トークン浪費・精度低下 | 要調整・揺れがある | ドキュメントやプロジェクトごとに発生 |
| Markdown | 本質的な情報に専念 | 設定不要・揺れがない | デザインが統一されている |

要するに、AI に書かせるのも人間が受け取るのも、必要最低限かつ本質的な情報だけにしたい訳です。**AI は構造化されたテキストに専念し、デザインの理解に余計な負荷をかけない**。ここが一番大切なポイントです。

## PR レビューの代わりに

私はプロジェクトによっては Pull Request のレビューを一切せず、更新されたドキュメントだけを読んで仕様や実装を把握しています。差分は一切見ていません。

有料プランではブランチごとにプレビューを作れるので、Pull Request を開かなくても仕様がひととおり把握できます。私は無料プランですが、家ではローカルでドキュメントサーバーを立てて（ `mint dev` コマンドを利用）、スマホを眺めながらレビューしています。とても楽なのでおすすめです😉

## おわりに

Mintlify に限らず Docs as Code を提供するサービスは、エージェント開発時代とかなり噛み合わせがいいのではと感じました。

巷では HTML を直接生成させる方法もよく耳にしますが、個人的には前述のとおり Markdown と HTML を使い分ける方法が流行ると予想しています。

気になった方はぜひ、Mintlify を試してみてください！

https://mintlify.com

[^1]: [yjn279/trinity | GitHub](https://github.com/yjn279/trinity)
[^2]: [Quick Start | Mintlify](https://mintlify.com/docs/quickstart)
[^3]: [mintlify/docs | GitHub](https://github.com/mintlify/docs)
