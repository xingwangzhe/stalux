---
title: 不要再用微软auth验证器了!
abbrlink: 52579
date: "2025-04-13 14:03:41"
updated: "2025-07-04 18:44:32"
desc: "为什么?事情还要从我瞎折腾开始:某天看到群友推荐开源的auth验证器,心里不免痒痒,也想试试,所以就开始想办法导出微软的authenticator中的密钥,发现了一个震惊的事:它导不出来!!!,这意味着,我只能通过微软账户来迁移这些一次性验证密钥,但关键的是,只能迁移微软的,第三方账户的并没有通过云存储来迁移,我..."
categories:
    - 胡思乱想
tags:
    - 记录
    - 教程
    - 胡思乱想
    - 短文
---

## 诚如标题所言,不要再用了

为什么?事情还要从我瞎折腾开始:某天看到群友推荐开源的auth验证器,心里不免痒痒,也想试试,所以就开始想办法导出微软的authenticator中的密钥,发现了一个震惊的事:**它导不出来!!!**,这意味着,我只能通过微软账户来迁移这些一次性验证密钥,但关键的是,**只能迁移微软的**,第三方账户的并没有通过云存储来迁移,我不禁为之冷汗,下定决心要迁移这些,不然早晚有一天要被它**绑死**

![Screenshot](https://i.ibb.co/gbDg8VKN/Screenshot-2025-04-13-14-08-42-67-afe91c8b597521825b1b16311f13a9c1.webp)

<!--more-->

[手动导出 Microsoft Authenticator 中的2FA密钥 | 吹比💨](https://chuibi.com/2023/10/05/%E6%89%8B%E5%8A%A8%E5%AF%BC%E5%87%BA-microsoft-authenticator-%E4%B8%AD%E7%9A%84%E5%AF%86%E9%92%A5/)

这是一个博主的方法,但国内安卓基本很难root,我也不想云数据迁移搞虚拟机root.多年不玩机,打算手动一个一个来改

## 手动重置:重新开始

虽然有些账户我自己很少用,但是既然下定决心了,就得一个一个手动重新设置2FA,更进一步地,保留一下这些**最后的密钥**防止验证器失效打不开账户

> 那些加载圈是表示我正在上传到onedrive

![2025-04-13-141346](https://i.ibb.co/TM1ZMK5S/2025-04-13-141346.webp)

## 手机端2FA验证器:Stratum

[Open-source two-factor authentication app - Stratum](https://stratumauth.com/)

:::tip

Stratum 是一款适用于 Android **的免费**开源**双因素身份验证应用程序**。它具有**加密备份**、图标、类别、高级自定义功能，甚至还有 **Wear OS 应用程序**。

与一些替代应用程序不同，Stratum 让您可以控制您的数据。您可以随时从其他应用程序**导入**和**导出**。
:::

这个导入导出非常轻松,而且由于它完全离线,所以不用担心跑路之后的密钥问题,\\x7e\x7e比如说[Authy](https://www.authy.com/)桌面端,这种验证器的可信度只会越来越低...~~

除了官网下载之外,也可以通过[F-Droid - Free and Open Source Android App Repository](https://f-droid.org/zh_Hans/)这个来下载

> F-Droid的界面与一般的应用商店的界面都不太一样,正如它秉持的自由哲学那样,它确实没迁就用户,当然,你知道我是什么意思😀

你需要在你的F-Droid里面添加下面的存储库

> Stratum is currently only available on the F-Droid client through the [IzzyOnDroid repo](https://apt.izzysoft.de/fdroid/). You must first add this repository in the F-Droid client.

## 桌面端

[Ente Auth - Open source 2FA authenticator, with E2EE backups](https://ente.io/auth/)

> 这个的界面有一种web风格,可能这也是一种;e

这个不止桌面端,移动端也有,但我没有优先推荐这个的原因是它倾向于登录账户(当然也能够离线使用),这意味着它使用了在线账户,当然是加密的账户:**端到端加密**,虽然这个方便同步,但是我还是信奉**纯离线的**验证器的

## 总结

对这些大厂垄断巨头,不能够太过信任,自己能够自由控制的数据,才是真正的自己的数据
