---
title: 学了点js
abbrlink: fcbe0bf5
date: 2024-09-25 21:05:29+00:00
updated: "2024-10-15 21:05:43"
categories:
    - 前端
tags:
    - 记录
    - 前端
    - js
    - 学习
    - 进步
---

_语法挺有趣的_

<!--more-->

源码来源于[freecodecamp](https://)

```js
const character = "!";
const count = 10;
const rows = [];
let inverted = false;

function padRow(rowNumber, rowCount) {
    return (
        " ".repeat(rowCount - rowNumber) +
        character.repeat(2 * rowNumber - 1) +
        " ".repeat(rowCount - rowNumber)
    );
}

for (let i = 1; i <= count; i++) {
    if (inverted) {
        rows.unshift(padRow(i, count));
    } else {
        rows.push(padRow(i, count));
    }
}

let result = "";

for (const row of rows) {
    result = result + "\n" + row;
}

console.log(result);
```

## 逐步分析

## 变量定义

使用`let`定义变量，而且还不分类型，这说明js变量定义很宽松呀。const，顾名思义，它也是定义固定的变量

数组定义用了`[]`，这和`java`有点像。

## 函数声明

使用`function`关键字进行声明，同样不分变量类型，内部和c/cpp差不多，而且似乎某些类型变量自带方法，就比如第一个函数的`.repreat()`方法，似乎是字符串自带的，很方便地进行了重复，不用我再写一遍循环。

还有`.push`.unshift`.等方法，看来可以实现栈，队列等数据结构。

## 输出

使用的是`console.log()`方法进行输出，当然我还不了解其他可能的输出方法，就先这么记了

### 示例结果

```
// running tests
// tests completed
// console output

         !
        !!!
       !!!!!
      !!!!!!!
     !!!!!!!!!
    !!!!!!!!!!!
   !!!!!!!!!!!!!
  !!!!!!!!!!!!!!!
 !!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!
```

回想起曾经大一自己写的金字塔了：）
