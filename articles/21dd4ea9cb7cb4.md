---
title: "5分間で理解するJavaScriptのカンマ演算子"
emoji: "👾"
type: "tech"
topics:
  - "js"
  - "ts"
published: true
published_at: "2023-06-07 22:34"
publication_name: "activecore"
---

## はじめに
こんにちは！JavaScriptと戯れがちな新卒エンジニアです。
何の役に立つかは分かりませんが、5分間でJSのカンマ演算子を理解します。

## 目標
このコードを理解するのが目標です。
```javascript
if (false, true) {
  console.log(true)
}

// Output: true
```

## 解説
カンマ演算子は、複数の式が評価される複合式を作成[^1]します。
ただし、返されるのは最後の式の値のみです。
```javascript
const a = (1 + 2, 3 + 4);
console.log(a);  // 7
```

もしかしたら、for文で見かけたことがあるかもしれません。
```javascript
for (let i = 0, j = 10; j >= 0; i++, j--) {
  console.log(i + j);  // 10
}
```

今までの例のように、単一の式が求められる場所で複数の式を記述したい場合に使うことができます[^1]。

## 実例
それでは、カンマ演算子と戯れていきましょう！
以下は最も単純なコードです。
```javascript
1, 2  // 2
```

丁寧に書くなら、このようになります。
```javascript
const a = (1, 2);  // 文法エラーになるため括弧でくくる
console.log(a);  // 2
```

引数を渡すときのカンマと区別するためには、括弧で括ります。
```javascript
console.log((1, 2));  // 2
```

3つ以上の式も複合式にできます。
```javascript
console.log((1, 2, 3))  // 3
```

カンマ演算子を使うことで、少しだけ楽に宣言できます。
このコードで気をつけるべきは、`console.log()`の中の`,`がカンマ演算子ではないことです。
```javascript
const a = 1, b = 2;
console.log(a, b);  // 1 2
```

こんなこともできます。
1つ目と2つ目の式で代入を、3つ目の式で比較をしています。返される値は`a < b`を評価した`true`なので、if文の中の処理が実行されます。
```js
if (a = 1, b = 2, a < b) {
  console.log(a, b);  // 1 2
}
```

最後に、今回理解したいコードをもう一度見てみましょう！
簡単ですね。最後の`true`が返されるため、if文の中の処理が実行されます。
```javascript
if (false, true) {
  console.log(true)  // true
}
```

## おわりに
カンマ演算子を知ったのはほんの偶然で、JSでタプルを使おうとして想定外の挙動に陥った結果、存在を知ることとなりました。
```javascript
const a = (1, 2)
console.log(a)  // (1, 2) を期待した
console.log(typeof a)  // 'tuple' を期待した
```

TypeScriptにはタプルがある[^2]そうです。

[^1]: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Comma_operator
[^2]: https://typescriptbook.jp/reference/values-types-variables/tuple