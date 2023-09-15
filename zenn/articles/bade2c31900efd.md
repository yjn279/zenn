---
title: "JSでハマったやつ"
emoji: "📚"
type: "tech"
topics: []
published: false
---

```js
class Test {
  fuga(a, c) {
    hoge(
      a = a,
      b = 2,  // bに値を渡してるつもり
      c = c,
    );
  }
}

function hoge(a, b=1, c=undefined) {
  console.log(a, b ,c);  // bはデフォルトでも指定してるつもり
}

function main() {
  tmp = new Test();
  tmp.fuga(1, 3);
}

main()
// ReferenceError: b is not defined
// fuga	@ test.gs:5
// main	@ test.gs:17
```


川崎くんのおかげでこうなることが分かりました。
a = 2は文であり式ではない。なので値も返さないと思っていた。
let a = 1;
console.log(a = 2)  // 2

a = 2が値を返すなら最初のコードが動かないのはわかるけど、a = 2が値を返すのには納得してない



これはエラー（わかる）
console.log(const a = 2)

Go
var a = 1
fmt.Println(a = 2)  // syntax error

Python
print(a = 1)
// TypeError: 'a' is an invalid keyword argument for print()


これで解決
[RAW]
// キーワード引数のみ. デフォルト値も持てる 
function f({name, age = -100}) { 
  console.log(name, age); 
} 
// 呼出し側は, オブジェクトでなければならない   
f({name:'Sato'});     //=> 'Sato' -100 
let obj = {name:'Yamada', age:20} 
f(obj);               //=> 'Yamada' 20