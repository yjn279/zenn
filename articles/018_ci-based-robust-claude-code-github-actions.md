---
title: "CIによる堅牢なClaude Code GitHub Actions開発"
emoji: "🛌"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - "github"
  - "claude"
published: true
published_at: "2025-06-02 09:00"
publication_name: "activecore"
---

## はじめに

最近Claude Code GitHub Actionsを触り始め、その便利さに感動しています。

Claude 4の性能も相まって、これでスマホからも開発できるぞと思ったのですが、エンジニアである以上はやはりコードの品質が気になるところ。そこでベッドに寝転びながらスマホ片手に開発する生活を手に入れるべく、CIによる最低限の品質が担保されたClaude Code GitHub Actionsによる開発フローを構築してみました！

この記事では、Claude Code GitHub ActionsにCIを導入し、堅牢な開発フローを構築する方法について解説します。

## 結論

こちらのWorkflowを設定することで、CIを通過したClaudeのコードが生成されます。

```yml: .github/workflows/claude.yml
name: Claude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@claude') || contains(github.event.issue.title, '@claude')))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      # 利用するCIツールに応じたセットアップ
      - name: Setup Biome
        uses: biomejs/setup-biome@v2

      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          allowed_tools: "Bash(biome ci .)"  # 利用するCIツールに応じた実行コマンド
          assignee_trigger: "claude"
```

さらに、Issueテンプレートを作成してClaude Codeを簡単に呼び出せるようにしておきます。

```markdown: .github/ISSUE_TEMPLATE/feature-request.md
---
name: Feature request
about: Use this template for tracking new features.
title: "feat: [FEATURE NAME]"
labels: enhancement
assignees: ''
---
@claude

## 概要

## 注意事項

- `biome ci .` を実行し、エラーが出ない状態にして実装完了とすること。

```

:::message
上記のWorkflowは、JavaScriptを利用したWeb開発での、Biome[^1]の使用を想定しています。
本記事の想定読者はこれに限りませんが、コメント部分は適宜変更してください。
:::

## 解説

正直、解説することはあまりないのですが、一応説明していきます。

例として、Issueの作成時に `@claude` メンションをするケースで考えてみましょう。以下のように、単にCIコマンドを実行するよう記載しただけでは、CIは実行できません。

```markdown
@claude

ログイン機能を実装してください。
実装が完了したら、 `biome check --write .` を実行すること。
```

実は、GitHubリポジトリにはBashコマンドを実行できない旨が記載されています（ドキュメントしか見ておらず見落としていた…）。また、コマンドを実行したい場合には、toolとしての明示的なコマンドの許可が必要な旨も記載されています。

> Claude does not have access to execute arbitrary Bash commands by default. If you want Claude to run specific commands (e.g., npm install, npm test), you must explicitly allow them using the allowed_tools configuration:[^2]

```yml
- uses: anthropics/claude-code-action@beta
  with:
    allowed_tools: "Bash(npm install),Bash(npm run test),Edit,Replace,NotebookEditCell"
    disallowed_tools: "TaskOutput,KillTask"
    # ... other inputs
```

という訳で、Claude Code GitHub Actionsによる堅牢なコードを手に入れる第一歩としては、Actionをセットアップした際のWorkflowに `allowed_tools` を追加すればOKです。そのほか、必要に応じて事前にCIツールのセットアップなどをしてあげます。

CIの実行コマンドを許可したら、あとはそのコマンドを使うようClaudeに指示するだけです。Issueの作成時に都度指示しても良いのですが、 ~~面倒なので~~ 開発フローと謳っているからにはもうひと手間加えましょう。

ということで、Claudeのメンション＆CIコマンドを実行する旨をあらかじめ記載したIssueテンプレートを作成しておきます。こうすることで、Issueの作成時にタイトルとタスクさえ記載すれば、CIを通過した堅牢なコードが生成されるようになりますね。

## おわりに

だいぶ初歩的な内容ですが、地味にリポジトリの内容を見落としていたので文章にしてみました。

今回はサンプルとしてBiomeのみを利用しましたが、テスト含めほかのCIツールも同様の方法で適用可能です。また今回の記事には含めていませんが、ClaudeのPull Requestなりを発火点としてデプロイされる状態にしておくことで、（Web開発であれば）スマホでのCI/CD開発が実現できます。

これで、布団から出られないときでも寝ながら開発ができますね！

[^1]: [Biome、Webのためのツールチェーン](https://biomejs.dev/ja/)
[^2]: [Custom Tools | anthropics/claude-code-action](https://github.com/anthropics/claude-code-action?tab=readme-ov-file#custom-tools)
