---
title: "JavaScriptでデフォルト引数と代入式にハマった話"
emoji: "📚"
type: "tech"
topics:
  - "javascript"
  - "typescript"
published: true
---

## はじめに

Google Apps Script（=JavaScript）でメソッドを実装していたところ、**デフォルト引数と代入式**の組み合わせで盛大にハマりました。この記事では当時のコードとハマりどころ、そして最終的に落ち着いた書き方をメモしておきます。

## 想定していた書き方

まずはハマったときのコードです。`Test#fuga` から `hoge` を呼び出すときに、引数 `b` へ `2` を渡したつもりでした。

```js
class Test {
  fuga(a, c) {
    hoge(
      a = a,
      b = 2, // b に値を渡しているつもり
      c = c,
    );
  }
}

function hoge(a, b = 1, c = undefined) {
  console.log(a, b, c); // b はデフォルトでも指定しているつもり
}

function main() {
  const tmp = new Test();
  tmp.fuga(1, 3);
}

main();
// ReferenceError: b is not defined
// fuga @ test.gs:5
// main @ test.gs:17
```

実際には `ReferenceError: b is not defined` が投げられます。 `b` に値を渡すどころか、`b` そのものが存在しないと言われてしまいました。

## 何が起きていたのか？

ポイントは **JavaScriptの代入は式であり、値を返す** という仕様です。`a = a` や `b = 2` は「代入」という副作用だけでなく、代入後の値をそのまま返します。そのため上記のコードは次のように解釈されます。

- `a = a` は `a` の値を返すので、`hoge` の第1引数には単に `a` が渡る。
- `b = 2` も `2` を返すが、ここでは単なる式として評価されるだけで、キーワード引数のように `b` へ束縛されるわけではない。
- `c = c` も同様。

そして極めつけは、`b` という変数自体がそのスコープで宣言されていないため **`ReferenceError`** が発生します。代入式が値を返すことを理解していなかったので、「文だから値を返さないはず」と思い込んでしまったのが敗因でした。

```js
let a = 1;
console.log(a = 2); //=> 2 代入した値がそのまま返ってくる
```

代入式が値を返すのは仕様ですが、個人的には直感と反していたのでハマりやすいポイントだと感じました。

## 他言語との違いで混乱した

普段触っている他の言語を想像すると、余計に混乱します。

- **Go**: 代入は文とみなされ、式として評価しようとするとシンタックスエラー。

  ```go
  var a = 1
  fmt.Println(a = 2) //=> syntax error
  ```

- **Python**: `=` は式にならず、キーワード引数のように書くと `TypeError`。

  ```python
  print(a = 1)
  #=> TypeError: 'a' is an invalid keyword argument for print()
  ```

この感覚のままJavaScriptに触ると、「代入は文だから式としては扱えないよね」という思い込みをしてしまいがちです。JavaScriptでは **代入式が値を返す** という仕様を前提に考える必要があります。

## 解決した書き方

今回やりたかったことは「関数に名前付き引数っぽく値を渡したい」というだけでした。そこでオブジェクトを渡すスタイルに変えました。これならばデフォルト値も簡単に扱えます。

```js
function hoge({ name, age = -100 }) {
  console.log(name, age);
}

hoge({ name: "Sato" }); //=> 'Sato' -100

const obj = { name: "Yamada", age: 20 };
hoge(obj); //=> 'Yamada' 20
```

JavaScriptやTypeScriptでは、オブジェクトを引数に渡しつつ分割代入を使うと「擬似的なキーワード引数」を表現できます。今回のような「特定の引数だけ上書きしたい」ケースでは素直にこの書き方を選ぶのが安全でした。

## TypeScriptでの書き方

今回の例はApps Script上でJavaScriptとして動かしていましたが、TypeScriptでも基本的な考え方は同じです。型を付けておくことで、呼び出し側で渡し忘れたプロパティをコンパイル時に検出できるようになります。

```ts
type HogeArgs = {
  name: string;
  age?: number;
};

function hoge({ name, age = -100 }: HogeArgs) {
  console.log(name, age);
}

const obj: HogeArgs = { name: "Yamada", age: 20 };
hoge(obj);

hoge({ name: "Sato" });
// hoge({ age: 10 }); //=> Property 'name' is missing in type ...
```

`age` をオプショナルにしつつデフォルト値を設定できるので、JavaScript版と同じ呼び出し方がそのまま使えます。`name` を必須にしたい場合はインターフェースで必須にしておけばよく、意図しない呼び出しを型チェックで防げます。

## おわりに

代入式が値を返すこと自体は仕様どおりですが、「引数名を書く＝その引数へ代入する」ように錯覚してしまうとハマります。オブジェクトを受け取るインターフェースに揃えておくと、後から引数が増えても呼び出し側で柔軟に対応できるので一石二鳥でした。同じところで迷子になっている方のヒントになれば幸いです。
