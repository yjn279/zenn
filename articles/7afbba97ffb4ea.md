---
title: "配列をオブジェクトに分割代入できる"
emoji: "🎉"
type: "tech"
topics: []
published: false
---

```js
const array = [1, 2, 3];
const {
  0: a,
  1: b,
  2: c,
} = array;

console.log(a, b, c)  // 1 2 3
```