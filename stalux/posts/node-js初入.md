---
title: node.js初入
abbrlink: 36480
date: 2024-12-10 20:10:22+00:00
updated: '2025-07-04T18:44:32.349+08:00'
categories:
- 后端
tags:
- 学习
- js
- 后端
- 进步
- 记录
---

Node.js® 是一个免费、开源、跨平台的 JavaScript 运行时环境, 它让开发人员能够创建服务器 Web 应用、命令行工具和脚本。

<!--more-->

## 安装

当然是前去[node.js官网](https://nodejs.org/zh-cn)下载，安装好之后，在命令行窗口

> node -v

如果显示版本号就说明安装成功了

## Buffer

### alloc && allocUnsafe

> `Buffer` 是一个特殊的类，用于处理二进制数据流。它允许你以一种类型化数组的方式处理原始二进制数据。`Buffer` 类在全局范围内可用，不需要 require 任何模块即可使用。

buffer创建方式

```js
//1.js

let buf = Buffer.alloc(10);

console.log(buf);
```

在命令行运行

```cmd
node 1.js
```

结果是

```cmd
<Buffer 00 00 00 00 00 00 00 00 00 00>
```

> 当然Buffer还有`Buffer.allocUnsafe()`方法,诚如其名，这并不安全，因为会保留旧数据，但是这种创建比较块

### from

unicode ascii

```js
let buf = Buffer.from('hello');
console.log(buf);
```

结果是

```cmd
<Buffer 68 65 6c 6c 6f>
```

这里是把对应字符的对应的unicode码表的数字转换为16进制。

> Unicode是ASCII的超集，Unicode也可以叫`万国码`。一般情况下，在英语文字的字符可以直接在ASCII表找到。

问了下kimi

| 类别             | 方法签名                                       | 描述                                       |
|------------------|------------------------------------------------|------------------------------------------|
| 创建 Buffer      | `Buffer.alloc(size[, fill[, encoding]])`        | 分配一个指定大小的新的 Buffer。           |
|                 | `Buffer.allocUnsafe(size)`                     | 分配一个指定大小的新的 Buffer，不初始化填充。|
|                 | `Buffer.allocUnsafeSlow(size)`                 | 与 `Buffer.allocUnsafe()` 类似，但在必要时会进行零填充。 |
|                 | `Buffer.from(array)`                          | 从包含数字的数组创建一个新的 Buffer。       |
|                 | `Buffer.from(buffer)`                         | 从现有的 Buffer 创建一个新的 Buffer。       |
|                 | `Buffer.from(string[, encoding])`              | 从字符串创建一个新的 Buffer。               |
| 写入 Buffer      | `buffer.write(string[, offset[, length]][, encoding])` | 向 Buffer 写入字符串。         |
|                 | `buffer.writeInt8(value, offset[, noAssert])`   | 向 Buffer 写入 8 位有符号整数。       |
|                 | `buffer.writeUInt8(value, offset[, noAssert])`  | 向 Buffer 写入 8 位无符号整数。     |
|                 | `buffer.writeInt16LE(value, offset[, noAssert])` | 向 Buffer 写入 16 位有符号整数（小端序）。 |
|                 | `buffer.writeUInt16LE(value, offset[, noAssert])` | 向 Buffer 写入 16 位无符号整数（小端序）。 |
|                 | `buffer.writeInt32LE(value, offset[, noAssert])` | 向 Buffer 写入 32 位有符号整数（小端序）。 |
|                 | `buffer.writeUInt32LE(value, offset[, noAssert])` | 向 Buffer 写入 32 位无符号整数（小端序）。 |
|                 | `buffer.writeFloatLE(value, offset[, noAssert])`  | 向 Buffer 写入 32 位浮点数（小端序）。 |
|                 | `buffer.writeDoubleLE(value, offset[, noAssert])` | 向 Buffer 写入 64 位浮点数（小端序）。 |
| 读取 Buffer      | `buffer.readInt8(offset[, noAssert])`           | 从 Buffer 读取 8 位有符号整数。         |
|                 | `buffer.readUInt8(offset[, noAssert])`          | 从 Buffer 读取 8 位无符号整数。         |
|                 | `buffer.readInt16LE(offset[, noAssert])`        | 从 Buffer 读取 16 位有符号整数（小端序）。 |
|                 | `buffer.readUInt16LE(offset[, noAssert])`       | 从 Buffer 读取 16 位无符号整数（小端序）。 |
|                 | `buffer.readInt32LE(offset[, noAssert])`        | 从 Buffer 读取 32 位有符号整数（小端序）。 |
|                 | `buffer.readUInt32LE(offset[, noAssert])`       | 从 Buffer 读取 32 位无符号整数（小端序）。 |
|                 | `buffer.readFloatLE(offset[, noAssert])`        | 从 Buffer 读取 32 位浮点数（小端序）。    |
|                 | `buffer.readDoubleLE(offset[, noAssert])`       | 从 Buffer 读取 64 位浮点数（小端序）。    |
| 复制和填充 Buffer | `buffer.copy(target[, targetStart[, sourceStart[, sourceEnd]]])` | 将 Buffer 的数据复制到另一个 Buffer。 |
|                 | `buffer.fill(value[, offset[, end]][, encoding])` | 填充 Buffer 的数据。           |
|                 | `buffer.slice([start[, end]])`                  | 返回一个新的 Buffer，是原 Buffer 的一个切片。 |
| 比较 Buffer      | `buffer.equals(otherBuffer)`                    | 比较 Buffer 和另一个 Buffer 是否相等。     |
|                 | `buffer.compare(otherBuffer)`                   | 比较 Buffer 和另一个 Buffer。             |
| 转换 Buffer      | `buffer.toString([encoding[, start[, end]]])`    | 将 Buffer 转换为字符串。           |
|                 | `buffer.toJSON()`                              | 返回 Buffer 的 JSON 表示。             |
|                 | `buffer.slice([start, end])`                    | 返回一个新的 Buffer，是原 Buffer 的一个切片。 |

* Buffer 操作是 Node.js 中性能敏感的部分，因为它们直接与内存打交道。正确使用 Buffer 可以提高应用程序的性能。

## fs

| 操作类型 | 异步方法 | 同步方法 |
|----------|----------|----------|
| 删除文件或目录 | `fs.rm(path[, options], callback)` | `fs.rmSync(path[, options])` |
| 删除空目录 | `fs.rmdir(path[, options], callback)` | `fs.rmdirSync(path[, options])` |
| 读取文件 | `fs.readFile(path[, options], callback)` | `fs.readFileSync(path[, options])` |
| 写入文件 | `fs.writeFile(file, data[, options], callback)` | `fs.writeFileSync(file, data[, options])` |
| 追加文件 | `fs.appendFile(file, data[, options], callback)` | `fs.appendFileSync(file, data[, options])` |
| 重命名文件 | `fs.rename(oldPath, newPath, callback)` | `fs.renameSync(oldPath, newPath)` |
| 读取目录 | `fs.readdir(path[, options], callback)` | `fs.readdirSync(path[, options])` |
| 创建目录 | `fs.mkdir(path[, options], callback)` | `fs.mkdirSync(path[, options])` |
| 获取文件状态 | `fs.stat(path, callback)` | `fs.statSync(path)` |
| 监控文件变化 | `fs.watch(filename[, options], listener)` | 不适用 |
| 链接文件 | `fs.link(existingPath, newPath, callback)` | 不适用 |
| 符号链接 | `fs.symlink(target, path[, type], callback)` | 不适用 |

## 同步方法VS异步方法

### 同步方法 (Synchronous Methods)

* ​**阻塞**​：同步方法会阻塞事件循环，直到操作完成。在操作进行期间，Node.js 不能执行其他 JavaScript 代码，这可能会导致性能问题，尤其是在 I/O 操作中。
* ​**直接返回**​：同步方法会直接返回操作的结果或抛出异常。
* ​**错误处理**​：错误通过抛出异常的方式处理，可以使用 `try...catch` 语句捕获。
* ​**简单性**​：同步方法的代码通常更简单直观，因为它们遵循顺序执行的逻辑。
* ​**使用示例**​：

### 异步方法 (Asynchronous Methods)

* ​**非阻塞**​：异步方法不会阻塞事件循环。当调用一个异步方法时，Node.js 会在后台启动一个操作，然后立即继续执行后续代码，不会等待操作完成。
* ​**回调函数**​：异步方法通常接受一个或多个回调函数作为参数。当操作完成（无论是成功还是失败）时，Node.js 会调用这些回调函数。
* ​**错误处理**​：错误通常通过回调函数的第一个参数传递。
* ​**性能**​：对于 I/O 密集型操作，如文件读写，异步方法可以提高性能，因为它们允许其他操作同时进行，不会因为等待磁盘操作而闲置。



