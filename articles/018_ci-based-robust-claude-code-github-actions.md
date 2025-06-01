---
title: "CI統合Claude Code GitHub Actionsで堅牢なコード開発環境を構築する"
emoji: "🤖"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - "github"
  - "githubactions"
  - "ci"
  - "claude"
  - "biome"
published: true
published_at: "2024-12-27 08:00"
publication_name: "activecore"
---

## はじめに

こんにちは。最近ベッドの上からでも開発したいと思い始めたwinnieです 🛏️

Claude Code GitHub Actionsを利用してAIと協力しながら開発を進める機会が増えてきましたが、特にスマホからClaudeを呼び出してそのままマージする場合、CIによる品質保証が重要になってきます。PCでの開発なら手元でLintやテストを実行してから推進できますが、スマホでの開発ではそうもいきません。

この記事では、Claude Code GitHub ActionsにCI（Continuous Integration）を統合し、堅牢なコード開発環境を構築する方法について解説します。

## 結論

以下のWorkflowを利用することで、Claude Codeによるコード生成時に自動的にCIチェックを実行し、品質を保証できます。

```yml
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

      - name: Setup Biome
        uses: biomejs/setup-biome@v2
        with:
          version: latest

      - name: Run Claude Code
        id: claude
        uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          allowed_tools: "Bash(biome ci .)"
          assignee_trigger: "claude"
  
  quality:
    needs: claude
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Biome
        uses: biomejs/setup-biome@v2
        with:
          version: latest

      - name: Run Biome
        run: biome ci .
```

## 前提条件

この記事では以下の環境を前提としています：

- **ReactによるWebフロントエンド開発**
- **CIツールとしてBiomeを利用**（ESLint + Prettierなど他のツールでも同様の方法で適用可能）
- Claude Code GitHub Actionsの基本的な導入は完了済み
- Biome等のLintツールの導入も完了済み

:::message
Claude Code GitHub Actionsの導入方法やBiomeの基本的な設定については、本記事では解説しません。それぞれの公式ドキュメントを参照してください。
:::

## 検討したアプローチ

最初から上記の解決方法に辿り着いたわけではありません。いくつかのアプローチを検討した結果、現在の形に落ち着きました。

### アプローチ1: Claude Code内でLintチェックを実行

最初に考えたのは、GitHub Issue内でClaudeにLintチェックも依頼する方法でした。

```markdown
@claude ログイン機能を実装してください。また、biome ci . を実行してLintエラーがないことも確認してください。
```

しかし、デフォルトではClaude CodeでBashコマンドを実行する権限がないため、この方法は利用できませんでした。

### アプローチ2: Workflowの結果をClaude Codeに参照させる

次に、Claude Codeとは別にLintチェック用のWorkflowを実行し、その結果をClaude Codeに参照させる方法を検討しました。

しかし、Claude Code GitHub Actionsの仕様上、他のWorkflowの実行結果を直接参照する機能はないため、この方法も断念しました。

### アプローチ3: Lintの結果をコメントで通知

Lintの結果をIssueコメントとして投稿し、それを元にClaudeが再度修正を行う方法も考えましたが、これは解決前に別の方法が見つかったため実装には至りませんでした。

## 解決方法

最終的に、Claude Code GitHub Actionsの公式ドキュメントを詳しく読み直したところ、`allowed_tools`パラメータでBashコマンドの実行権限を付与できることが分かりました[^1]。

### キーポイント: allowed_toolsパラメータ

```yml
- name: Run Claude Code
  uses: anthropics/claude-code-action@beta
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    allowed_tools: "Bash(biome ci .)"  # ここがポイント！
```

`allowed_tools`パラメータに`"Bash(biome ci .)"`を指定することで、Claude CodeがBiomeによるLintチェックを実行できるようになります。

### Workflowの構成

Workflowは2つのジョブで構成されています：

1. **`claude`ジョブ**: Claude Codeを実行し、Biomeチェックの権限も付与
2. **`quality`ジョブ**: 念のためClaude実行後に再度Biomeチェックを実行

```yml
quality:
  needs: claude  # claudeジョブの完了を待つ
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Biome
      uses: biomejs/setup-biome@v2
      with:
        version: latest

    - name: Run Biome
      run: biome ci .
```

この二重チェック体制により、Claude Codeが生成したコードの品質を確実に保証できます。

## 実際の使用例

このWorkflowを導入後、以下のようにスマホからClaudeに依頼できるようになりました：

```markdown
@claude 
ユーザープロフィール画面のコンポーネントを作成してください。
以下の要件を満たしてください：

- TypeScriptで実装
- アバター画像の表示機能
- プロフィール編集フォーム
- レスポンシブデザイン対応

実装後は biome ci . でLintチェックも実行してください。
```

Claude Codeは以下の流れで動作します：

1. 要件に基づいてコンポーネントを実装
2. `biome ci .`を実行してLintエラーをチェック
3. エラーがあれば自動的に修正
4. 最終的にLintチェックをパスしたコードをコミット

## 応用例: テストの統合

Biome以外のツールでも同様のアプローチが可能です。例えば、テストツールを統合する場合：

```yml
allowed_tools: "Bash(npm test),Bash(biome ci .)"
```

複数のコマンドをカンマ区切りで指定することで、Lintチェックとテスト実行の両方をClaude Codeに実行させることができます。

## セキュリティ上の注意点

`allowed_tools`パラメータでBashコマンドの実行権限を付与する際は、セキュリティに注意が必要です：

- **必要最小限のコマンドのみを許可**：`Bash(biome ci .)`のように具体的なコマンドを指定
- **任意のBashコマンド実行は避ける**：`Bash`だけの指定は危険
- **信頼できるリポジトリでのみ使用**：プライベートリポジトリでの使用を推奨

## おわりに

Claude Code GitHub ActionsにCIを統合することで、スマホからでも安心してAIと協力しながら開発を進められるようになりました 📱

特に我々の開発環境では、Cloudflareでプルリクエストごとにプレビューデプロイされるため、CIによるコード品質保証さえできれば、機能の検証自体はデプロイされたプレビュー環境でスマホから確認できます。

これで念願のベッドの上での開発が現実的になりました！🛏️✨

もちろん、重要な機能開発や複雑なリファクタリングはPCでしっかりと行いますが、簡単な機能追加やバグ修正であれば、この環境で十分対応可能です。

皆さんもぜひ、Claude Code GitHub ActionsとCIを組み合わせて、より柔軟で堅牢な開発環境を構築してみてください！

[^1]: [Advanced Configuration - Claude Code GitHub Actions](https://github.com/anthropics/claude-code-action?tab=readme-ov-file#advanced-configuration)
