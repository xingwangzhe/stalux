---
title: 从edgeone迁移到esa
date: "2026-02-05 17:55:30"
abbrlink: mv-edgeone-to-esa
tags:
    - esa
    - edgeone
    - pages
categories:
    - 迁移
---

## 引言

之前我一直用[edgeone](https://console.cloud.tencent.com/edgeone)托管我的博客,后来阿里云推出[esa](https://www.aliyun.com/product/esa)后,所以我决定把博客从edgeone迁移到esa.

以下都是说**免费版**,付费版就算了,我也用不起,那么相同点就不说了,主要说说不同点.

### 对比一览

| 对比项             | EdgeOne 免费版                                 | ESA 中国站免费版                        |
| ------------------ | ---------------------------------------------- | --------------------------------------- |
| 节点数量与覆盖     | ![edgeone](/pages/edgeone.webp) 仅有40左右节点 | ![esa](/pages/esa.webp) 达到140左右节点 |
| 压缩               | gzip,Brotli                                    | gzip,Brotli,Zstd                        |
| 安全性             | 仅支持http/2                                   | 支持http/2和http/3(QUIC)                |
| 套餐有效期与持续性 | 套餐长期有效，除非主动销毁,可使用多个免费套餐  | 永久免费、每个 UID 限领 1 个免费套餐    |

现在ESA 限制免费套餐数量,所以我也打算分享一下,获得更多免费套餐

[邀请你免费开通ESA试用，为我助力！](https://tianchi.aliyun.com/specials/promotion/freetier/esa?taskCode=25254&recordId=f499b7be2b6b164f06e0d982897e3be1)

扫描二维码也可以获得免费套餐

![二维码](/pages/esa.png)
