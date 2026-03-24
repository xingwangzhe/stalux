---
title: Moonbit 0.8.0 重大发布,我也要改一下我的包
abbrlink: moonbit-0-8-0-release-change-my-package
date: 2026-02-10 20:25:34
categories:
    - moonbit
tags:
    - moonbit
    - release
    - bit
---

就在不久之前，MoonBit 官方博客发布了 [MoonBit 0.8.0](https://www.moonbitlang.cn/blog/moonbit-0-8-0-release#%E5%B7%A5%E5%85%B7%E9%93%BE%E6%9B%B4%E6%96%B0)，工具链更新中最让人眼前一亮的就是新增的 `moon install` 命令。这意味着我们终于可以像使用 `cargo install` 或 `npm install -g` 那样，直接从远程仓库安装预编译的二进制工具了。看到这个消息，我第一反应是——得赶紧把我的 [license_checker](https://github.com/xingwangzhe/moonbit_license_checker) 项目适配一下，让它能被 `moon install` 优雅地安装。

## 踩坑：不是所有包都能被 install

一开始我觉得，只要在 `moon.mod.json` 里把版本号改一改，然后用户就能直接 `moon install xingwangzhe/license_checker` 了。结果实际测试的时候发现根本不行——工具链会提示这个包不是可执行的 main 包。翻了翻官方文档才明白：`moon install` 命令只能安装那些标记了 `is-main: true` 的可执行包，而我的项目结构是根目录作为库包，真正的 CLI 入口放在 `cmd/license-checker` 子包里。

这就尴尬了。我的 `moon.mod.json` 里定义的根包名是 `xingwangzhe/license_checker`，但这个根包本身并不是可执行的。真正能跑起来的二进制文件，其实是编译 `cmd/license-checker` 这个子包产生的。按照 MoonBit 0.8 的新语义，正确的安装命令应该是：

```bash
moon install xingwangzhe/license_checker/cmd/license-checker
```

看起来有点绕.但将就这样吧,本身就是一个小玩具,以后说不定官方自己会出一个`moon license_checker` 这种功能也有可能。

## 最后吐槽一句

折腾完这一下，功能上倒是没什么问题了。`moon install` 能正常工作，文档也写得明明白白。但有一个细节让我觉得特别尴尬：工具链目前没有提供 `moon uninstall` 命令。

也就是说，如果我装完之后发现不想要了，只能手动去 `~/.moon/bin` 目录下把二进制文件删掉。有点尴尬啊😓 希望官方后续能补上这个功能，不然每次测试安装都得手动`rm`，实在有点麻烦。

不过话说回来，MoonBit 0.8.0 仍在不断改进。作为早期用户，能见证这些变化，也算是一种特别的体验吧。
