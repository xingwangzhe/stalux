---
title: node.js:简单的HTTP服务器
abbrlink: 45780
date: "2024-12-11 17:28:32"
updated: "2025-07-04 18:44:32"
desc: "const http = require(\"http\");"
categories:
    - 后端
tags:
    - node.js
    - 后端
    - js
---

有意思，实现文件访问了

<!--more-->

## 引入需要的部分

```js
const http = require("http");
const fs = require("fs");
const path = require("path");
```

第一个http服务，第二个fs文件操作，第三个路径相关

## 第一步:创建http

```js
const server = http.createServer((req, res) => {});
```

## 第二部:http回调函数

### 定义路径

在回调函数里面写功能
首先定义路径

```js
let url = new URL(req.url, `http://${req.headers.host}`);
let pathname = url.pathname;
let filePath = path.join(__dirname, pathname);
//可以加个log看一下路径是否正确,这会在服务器运行，路径访问时打印
// console.log('Request for:' , filePath);
```

### 读取文件

```js
fs.readFile(filePath, (err, data) => {
    if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
    } else {
        // 根据文件扩展名设置Content-Type
        // const ext = path.extname(filePath).toLowerCase();
        //const mimeTypes = {
        //'.html': 'text/html',
        //'.js': 'application/javascript',
        //'.css': 'text/css',
        // 其他文件类型...
        //现代浏览器的资源嗅探已经足够先进，因此对文件扩展名设置Content-Type并不是必要的
        //};
        // const contentType = mimeTypes[ext] || 'application/octet-stream';
        // res.writeHead(200, {'Content-Type': contentType});
        res.end(data);
    }
});
```

### 设置端口，启动服务器

```js
server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});
```

## 完整代码

```js
const server = http.createServer((req, res) => {
    // 使用req.url和req.headers.host来创建完整的URL对象
    let url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = url.pathname;

    // 构建文件系统路径
    let filePath = path.join(__dirname, pathname);

    console.log("Request for:", filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found");
            return;
        } else {
            //   // 根据文件扩展名设置Content-Type
            //   const ext = path.extname(filePath).toLowerCase();
            //   const mimeTypes = {
            //     '.html': 'text/html',
            //     '.js': 'application/javascript',
            //     '.css': 'text/css',
            //     // 其他文件类型...
            //  现代浏览器的资源嗅探已经足够先进，因此对文件扩展名设置Content-Type并不是必要的
            //   };
            //   const contentType = mimeTypes[ext] || 'application/octet-stream';
            //   res.writeHead(200, {'Content-Type': contentType});
            res.end(data);
        }
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});
```

## hello world

![2024-12-11-175244](https://i.ibb.co/FnY4CrB/2024-12-11-175244.png)
