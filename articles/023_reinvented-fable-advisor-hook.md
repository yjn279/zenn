---
title: "【供養】Fable にアドバイザーをしてもらう Hook を再発明した【車輪】"
emoji: "🪦"
type: "tech"
topics:
  - "claude"
  - "claudecode"
  - "hooks"
  - "ai"
  - "agent"
published: true
published_at: "2026-08-24 12:00"
publication_name: "activecore"
---

## はじめに

~~Twitter~~ X で話題だった記事を思い出し、会話要約直後に Fable へ俯瞰の問いを立てさせるフックを作りました。

作ってから、同じことをする advisor ツールが標準搭載と知り[^1]、供養として advisor を紹介し、自作フックも軽く解説して成仏させます🪦

## advisor とは

設定を 1 行書くだけで、メインモデルが要所で別モデルに相談するようになります。動くのは Anthropic API のときだけです。設定方法は3つあり、1つ目はセッション中に打つコマンドで、そのまま既定として保存されます。

```
/advisor fable
```

設定ファイルに書けば、永続的な既定になります。

```json
{ "advisorModel": "fable" }
```

起動時のフラグはそのセッションだけ効き、設定ファイルより優先されます。advisor にはメインモデル以上の機能が要るので、Opus 4.7 以降がメインなら Fable を advisor にできます。

```bash
claude --advisor fable
```

発火の主導権は Claude 側にあり、回数を強制する設定はありません。入力はツール呼び出しと結果を含む会話全体で、返ってくるのは続行する前に適用する指針です。止めるときは `/advisor off` 、ツールごと無効にするなら環境変数 `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` を使います。

つまり、はじめに作ったフックが目指した「別のモデルに相談させて視座を戻す」という狙いは、標準機能ですでに満たされていました。24 行、要らなかったんですよね。

## 再発明した Hook について

会話が要約された直後に発火するフックです。Claude Code には、そのタイミングで呼び出せる `PostCompact` というフックがちょうど用意されていました。

受け取った要約を Fable に読ませ、返ってきた問いを `additionalContext` として Claude の文脈へ渡します。流れを図にすると次のとおりです。

```mermaid
flowchart LR
  work[作業] -->|文脈が膨らむ| compact[要約]
  compact --> hook[PostCompact フック]
  hook -->|要約を渡す| fable[Fable]
  fable -->|問いを返す| hook
  hook -->|additionalContext| claude[Claude]
  claude --> work
```

実装の全文はこの Pull Request にまとめてあります[^2]。

## どう使い分けるか？

供養しつつ、使い分けの軸として整理します。

| 観点 | advisor ツール | 自作フック |
| :-- | :-- | :-- |
| 発火 | Claude が決める | 要約のたびに必ず |
| 入力 | 会話全体 | 要約のみ |

基本は、公式機能である advisor ツールを使うのがよいと思います。強いて自作フックの利点を挙げるなら、渡す情報が要約だけなので、会話全体を渡す advisor ツールよりトークンの消費を抑えられる点です。

## おわりに

正直、解説することはあまりないのですが、事前に少し調べていれば防げた回り道でした。何かを作り込む前に、同じことをする機能がすでに無いか、まず探してみることをお勧めします。

Claude に何かを長く任せる場面があれば、ぜひ advisor ツールを試して、この失敗を成仏させてやってください！

[^1]: [advisor ツールで難しい判断をエスカレートする | Claude Code](https://code.claude.com/docs/ja/advisor)
[^2]: [feat: 会話が要約されたあと Fable に俯瞰を促す問いかけを求める | GitHub](https://github.com/yjn279/.claude/pull/84)
