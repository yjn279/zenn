---
title: "OpenClaw を Slack で動かす ── ACP プラグイン運用でハマった設定まとめ"
emoji: "🛠️"
type: "tech"
topics:
  - "openclaw"
  - "slack"
  - "acp"
  - "agent"
published: true
---

## はじめに

OpenClaw を Slack に接続し、ACP（Agent Client Protocol）プラグイン経由で AI エージェントを呼び出す構成を試していました🛠️

最終的に Trinity（Planner → Generator → Evaluator → PR の一連のフロー）が Slack 上で完走するところまで漕ぎ着けたのですが、デフォルト設定のままだと色々なところで詰まりました。

この記事は、そのときにハマったポイントと、最終的にどう設定値を調整したかをまとめた備忘録になります。

### 注意

- OpenClaw 自体の構築手順は扱いません。
- あくまで「動かしてみたら詰まった」ポイントの共有です。

## 対象読者

- OpenClaw を Slack に接続して使ってみたい人
- ACP プラグインで複数エージェントの連鎖を回したい人
- Slack Bolt と長時間タスクの相性に悩んでいる人

## 全体像

ハマりどころは、大きく以下の3レイヤーに分かれていました。

- **エージェント本体**：heartbeat の挙動
- **チャネル（Slack）**：Socket Mode のタイムアウト
- **プラグイン**：bonjour と ACP の挙動

それぞれ、何が問題で、どう設定したのかを順に解説していきます。

## エージェント：heartbeat 周り

### Session の汚染を分離する

```
agents.defaults.heartbeat.isolatedSession = true
```

OpenClaw のエージェントには、生存確認のために定期的に heartbeat を発火させる仕組みがあります。

問題は、デフォルトだと heartbeat が CLI セッションと同じコンテキストを共有してしまう ことです。これが何をもたらすかというと、ユーザーが @mention でエージェントを呼び出したときに、heartbeat 由来のノイズが文脈に紛れ込んでしまうのです。

`isolatedSession = true` にすることで、heartbeat を `agent:main:main:heartbeat` という専用 session に切り出せます。CLI session が汚れず、ユーザーの呼び出しに対するレスポンスもクリーンになりました。

### 長時間タスク中は割り込ませない

```
agents.defaults.heartbeat.skipWhenBusy = true
```

`/trinity` のような重めのコマンドを実行している最中に、heartbeat が割り込んできて困りました。生存確認のための heartbeat に、本処理を邪魔されてしまっては本末転倒です。

`skipWhenBusy` を有効にすることで、エージェントが busy 状態のあいだは heartbeat をスキップできます。これで、長時間タスク中の不要な割り込みが消えました。

## Slack：Socket Mode のタイムアウト

### Client Ping Timeout の延長

```
channels.slack.socketMode.clientPingTimeout = 45000
```

Slack の Socket Mode は、双方向の WebSocket 接続を ping / pong で維持しています。

ここで何度も socket が drop していたのですが、原因はこちら側の event loop が一時的にブロックされた際、 **デフォルトの 15 秒ではクライアント側の pong 応答が間に合わなかった** ことでした。

タイムアウトを 45 秒まで拡張することで、event loop の一時的な詰まりは吸収できるようになります。

### Server Ping Timeout の調整

```
channels.slack.socketMode.serverPingTimeout = 60000
```

サーバ側の死活判定も 60 秒に緩和しました。これは Slack Bolt の慣例的な値に揃えた格好です。

`clientPingTimeout` と片方だけ伸ばすと整合性が取れず、結局 disconnect が発生してしまうので、両方セットで設定するのが無難です。

## プラグイン：bonjour と ACP

### Bonjour のスパムを止める

```
plugins.entries.bonjour.enabled = false
```

OpenClaw 起動時、ログに `Can't probe ...` というメッセージが延々と流れ続けていました。

これは bonjour プラグインによる mDNS のプロービングに失敗していることが原因です。Slack 経由で動かす構成では mDNS は不要なので、プラグイン自体を無効にしてしまうのが手っ取り早い解決策でした。

### ACP child の自動承認

```
plugins.entries.acpx.config.permissionMode = "approve-all"
```

個人的に一番ハマったのが、これです。

Trinity を実行すると Planner subagent が起動するのですが、この子エージェントが Task / Agent tool を使うたびに **承認待ちで止まる** という事象が発生しました。Slack 上では人間がぽちぽち承認するわけにもいかず、フローが完全にデッドロックしてしまいます。

`permissionMode = "approve-all"` にすることで、ACP child のツール呼び出しを自動承認できます。もちろんセキュリティ的には許可範囲を狭める方が望ましいので、信頼できるエージェント構成であることを前提に有効化する必要があります。

### ACP の Turn Timeout を伸ばす

```
plugins.entries.acpx.config.timeoutSeconds = 3600
```

ACP のデフォルト turn timeout は 120 秒です。

Trinity のように Planner → Generator → Evaluator → PR までを1ターンで完走させたい場合、120 秒では到底足りません。実際、PR 作成の手前で頻繁にタイムアウトしていました。

仕方がないので、3600 秒（1時間）まで思い切って伸ばしました。長いタスクをまるっと任せる以上、ある程度はやむを得ない判断だと思います。

## 最終的な設定

ここまでの内容を反映した config がこちらになります。

```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "target": "slack",
        "to": "channel:C0B1NPV9R5X",
        "isolatedSession": true,
        "skipWhenBusy": true
      }
    }
  },
  "channels": {
    "slack": {
      "socketMode": {
        "clientPingTimeout": 45000,
        "serverPingTimeout": 60000
      }
    }
  },
  "plugins": {
    "entries": {
      "bonjour": {
        "enabled": false
      },
      "acpx": {
        "enabled": true,
        "config": {
          "permissionMode": "approve-all",
          "timeoutSeconds": 3600
        }
      }
    }
  }
}
```

## おわりに

エージェントを Slack のような外部チャネルで動かすときは、 **エージェント本体・チャネル・プラグインの3レイヤーが噛み合って初めて** まともに動くのだと、今回の試行で痛感しました。それぞれのレイヤーが「自分の都合」で勝手にタイムアウトしたり、勝手に割り込んだりするので、運用に乗せるためにはこのあたりの調整が避けて通れません。

特に Trinity のような複数エージェントの連鎖は、デフォルト設定だと必ずどこかで詰まります。同じところで詰まっている誰かの一助になれば幸いです😉

## 参考

- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)（Anthropic）
- [Slack Bolt for JavaScript](https://tools.slack.dev/bolt-js/)
- [Agent Client Protocol](https://agentclientprotocol.com/)
