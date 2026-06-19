---
title: node.js:试试express
abbrlink: 8479
date: "2024-12-18 18:05:43"
updated: "2025-07-04 18:44:32"
desc: Express 框架是一个快速、开放、极简的 web 应用开发框架，用于构建灵活和强大的 web 应用和 API。它是 Node.js 平台上最流行的框架之一，因为它提供了一套丰富的功能来简化和加速 web 开发过程。
categories:
    - node.js
tags:
    - 学习
    - 程序员
    - 记录
    - 前端
    - node.js
---

Express 框架是一个快速、开放、极简的 web 应用开发框架，用于构建灵活和强大的 web 应用和 API。它是 Node.js 平台上最流行的框架之一，因为它提供了一套丰富的功能来简化和加速 web 开发过程。

<!--more-->

## 使用

```
npm i express
```

引入头

```js
const express = require("express");
const app = express();
```

## 样例

### id

```js
const express = require("express");
const singers = require("./singers.json").singers;
const app = express();

console.log(singers);

app.get("/singers/:id", (req, res) => {
    let id = req.params.id;
    let singer = singers.find((singer) => {
        if (singer.id == id) {
            res.send(singer.name);
        }
    });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
```

### 验证

```js
const express = require("express");
const fs = require("fs");
const app = express();
const path = require("path");

function recordMiddleware(req, res, next) {
    let { url, ip } = req;
    console.log(`用户访问了${url}，IP地址为${ip}`);
    fs.appendFile(path.resolve(__dirname, "./access.log"), `${url} ${ip}\n`, (err) => {
        if (err) {
            console.log(err);
        }
    });
    next();
}

function checkcoode(req, res, next) {
    let { code } = req.query;
    if (code === "666") next();
    else res.send("验证码错误");
}
app.use(express.static(path.resolve(__dirname, "./")));
app.use(recordMiddleware);

//前台首页
app.get("/home", checkcoode, (req, res) => {
    res.send("首页你好");
});

app.get("/admin", checkcoode, (req, res) => {
    res.send("后台管理你好");
});

app.get("*", (req, res) => {
    res.send("404 Not Found");
});
app.listen(3000, () => {
    console.log("服务器启动成功，端口号为3000");
});
//后台首页
```

### 防盗链

```js
const express = require("express");
const app = express();
const path = require("path");

app.use((req, res, next) => {
    let reffer = req.get("Referrer");
    if (reffer) {
        let url = new URL(reffer);
        let hostname = url.hostname;
        console.log(hostname);
        if (hostname !== "127.0.0.1") {
            console.log("not 127");
            res.status = 404;
            res.end("Not Found");
        }
    }
    next();
});

app.use(express.static(path.resolve(__dirname, "./")));

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
```

###
