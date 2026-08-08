---
title: "MintlifyでAI開発時代の認知負荷を下げよう"
emoji: "🌿"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - "mintlify"
  - "markdown"
  - "ai"
  - "documentation"
  - "claudecode"
published: false
publication_name: "activecore"
---

:::message
この記事は、社内の共有会で発表した内容を雑にまとめたものです。
:::

## はじめに

ハーネスを組んでエージェントに任せるようになってから、Pull Request の差分を 1 行ずつ追う機会がめっきり減りました。計画して、実装して、評価する。この一周を AI が回してくれるので、細かい妥当性はそちらに任せておけば大体なんとかなります[^1]。

代わりに増えたのが、出てきた Markdown や HTML を読んで仕様や実装を把握する時間です。ところが、これがどちらもつらいんですよね。

Markdown は白黒の文字が並ぶだけで、正直まったく読む気が起きません。かといって HTML を出させると、今度はドキュメントごと、プロジェクトごとにデザインが変わります。中身を読む前にレイアウトを読み解くところから始まりますし、スタイルという本題と関係のない情報が混ざる分、AI の精度は落ちてトークンも余計にかかります。

という訳で、構造化した情報は Markdown に持たせて、それを HTML に描画する役目は道具に任せることにしました。その道具が [Mintlify](https://mintlify.com) です🌿

```mermaid
flowchart LR
  ai[AI] -->|構造| markdown[Markdown]
  markdown --> mintlify[Mintlify]
  mintlify -->|描画| html[HTML]
  html --> human[人間]
```

AI は Markdown で本質的な情報だけに集中し、型の決まった HTML は Mintlify がつくる。この構造にしたという話です。

## Mintlify とは

Mintlify は、ざっくり言うと Docs as Code、つまりドキュメントを Markdown のままリポジトリで管理して、そのまま Web サイトとして公開するためのサービスです[^2]。

実際、Mintlify 自身のドキュメントもこの方式で作られています。リポジトリを開いても、置かれているのはただの Markdown です。

![リポジトリに置かれた Markdown](/images/022_reduce-cognitive-load-with-mintlify-01.png)
*mintlify/docs より引用 [^3]*

この Markdown を HTML に変換するための設定も、同じリポジトリの中に置きます。`docs.json` に色やナビゲーションを書いておくと、それがそのままサイトの見た目になります。

![表示設定を書いた docs.json](/images/022_reduce-cognitive-load-with-mintlify-02.png)
*mintlify/docs より引用 [^3]*

つまり、中身も見た目も丸ごと Git の管理下に入る訳です。ブランチを切って直して、push すれば公開される。コードとまったく同じ道具立てで扱えるのが、この方式のいいところですね。

そして、これらを Mintlify で表示するとこうなります。

![Mintlify が表示したページ](/images/022_reduce-cognitive-load-with-mintlify-03.png)
*Mintlify Documentation より引用 [^2]*

中身は 1 文字も変わっていません。それでも、スタイルに色やメリハリがついて、左の目次でドキュメント体系が俯瞰できるだけで、読み始めるまでのハードルがまるで違います。

## Markdownは必要なのか？

最近は AI に直接 HTML を出力させる話もよく聞きますが、個人的にはあまりおすすめしません。

生成のたびにデザインが変わるので、仕様を知りたいだけなのに、まず今回のレイアウトを読み解くところから始めることになります。おまけに、タグやスタイルという本題と関係のない情報が文脈に混ざるので、AI の精度は落ち、トークンも余計にかかります。

| 生成させるもの | デザイン | コンテキスト | 認知負荷 |
| :-- | :-- | :-- | :-- |
| HTML | 調整が必要で、レイアウトも毎回変わる | デザインの情報が混ざり、精度低下とトークン浪費を招く | ドキュメントやプロジェクトごとに読み解き直す |
| Markdown | 設定は不要で、レイアウトも変わらない | 本質的な情報だけに専念できる | どのドキュメントでも同じ形で読める |

要するに、AI に書かせるのも人間が受け取るのも、必要最低限かつ本質的な情報だけにしたい訳です。**AI は構造だけを書き、見た目は道具に任せる**。ここが一番好きなポイントで、この線引きさえ成り立てば道具は Mintlify でなくても構いません。

## 仕様の追い方

いまは実装と一緒にドキュメントも更新させておいて、人間はそちらだけを読んでいます。差分は ~~見ない~~ 必要になったときだけ見ます。

有料プランではブランチごとにプレビューを作れるので、Pull Request を開かなくても、そのブランチの仕様がひととおり分かります。無料プランでもローカルで起動でき、同じ Wi-Fi ならスマホから見に行けるのは地味にありがたいポイントですね。

## おわりに

正直、解説することはあまりないのですが、認知負荷の下げ方としてはかなり効いたので文章にしてみました。

発表のあとの雑談では、参加者から「見やすさよりも、ドキュメントを最新に保つ仕組みのほうが大事ですよね」という指摘をもらいました。まったくその通りで、中身が古ければ仕様として読む意味がありません。

読みやすさと最新さ。この両方が揃ったときに、差分を追わない開発はようやく完成するのだと思います。ぜひ、手元のリポジトリで一度動かしてみてはいかがですか？😉

## 参考

- [Mintlify](https://mintlify.com)
- [Mintlify Documentation](https://mintlify.com/docs)
- [mintlify/docs: Official Mintlify documentation](https://github.com/mintlify/docs)

[^1]: [yjn279/trinity: Harness for long-running tasks.](https://github.com/yjn279/trinity)
[^2]: [Quickstart | Mintlify](https://mintlify.com/docs/quickstart)
[^3]: [mintlify/docs](https://github.com/mintlify/docs)
