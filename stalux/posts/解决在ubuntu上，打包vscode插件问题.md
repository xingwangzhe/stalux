---
title: 解决在ubuntu上，打包vscode插件问题
abbrlink: a2c639ef
date: "2025-08-18T20:24:07.923+08:00"
updated: "2025-08-18T20:44:30.696+08:00"
categories:
    - ubuntu
tags:
    - vscode
    - ubuntu
---

**ERROR: Extension entrypoint(s) missing. Make sure these files exist and aren't ignored by '.vscodeignore': extension/dist/extension.js**

这是我遇到的报错，关于如何解决该报错，请看下面

## 省流

[解决方案](https://stackoverflow.com/questions/74924411/error-extension-entrypoints-missing-make-sure-these-files-exist-and-arent-i)

<img src="https://i.ibb.co/d4PKV4ng/2025-08-18-20-22-14.webp" alt="2025-08-18-20-22-14" border="0">

正如这位所说

> 我不知道为什么，但在这种情况下，Linux上的默认npm和node版本似乎不能正常工作。就像在错误扩展入口点(s)丢失，而我试图用vsce包装开发的vscode扩展
> 我完全从我的系统中卸载了node和npm，甚至从我的全局 node_modules 中删除了 npm 目录，然后按照https://github.com odesource/distributions#using-ubuntu上的指南重新安装了所有内容。现在突然起作用了……

## 删除ubuntu原始node

一般都是通过snap安装的，可以轻松地从商店卸载，或者使用命令来卸载

## 访问[nodesource](https://github.com/nodesource/distributions)

根据它们提供的[文档](https://github.com/nodesource/distributions/blob/master/DEV_README.md)，安装

```bash title="ubuntu"
# Node.js v22.x:

#Using Ubuntu (Node.js 22)
#Before you begin, ensure that curl is installed on your system. If curl is not installed, you can install it using the following command:

sudo apt install -y curl
#Download the setup script:
```

```bash title="ubuntu"
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
#Run the setup script with sudo:

sudo -E bash nodesource_setup.sh
```

```bash title="ubuntu"
sudo apt install -y nodejs
# Verify the installation:
node -v
```

此时使用`vsce pack`打包就不会出现异常了

至此基本解决问题

## 参考

[解决方案](https://stackoverflow.com/questions/74924411/error-extension-entrypoints-missing-make-sure-these-files-exist-and-arent-i)
