---
title: "重要通知-请更新我的GPG公钥"
tags: ["GPG", "加密", "邮件"]
categories: GPG
date: "2026-03-23 19:19:20"
abbrlink: 2026-3-gpg-update
---

## 重要通知

我已废弃旧的 **GPG 公钥**，更换原因主要有两点：

1. 之前使用 **RSA** 加密算法，从中长期来看，量子计算机的发展会对其构成威胁；目前业界主流正在推进 **ECC (椭圆曲线加密)** 算法，我也跟进更换
2. 之前的公钥设置为**永久有效**，这不符合安全最佳实践，因此新公钥设置了**半年有效期**

基于以上原因，我决定重新生成 GPG 密钥，同时我也**废弃了教育邮箱的 GPG 密钥**，并且今后**不再为学生邮箱设置 GPG**——因为学校邮箱目前已经禁止第三方客户端登录使用了。

新公钥信息如下：

### 新公钥信息

- **邮箱**: `xingwangzhe@outlook.com`

- **密钥 ID**:

    ```
    3067B770E2103FA6
    ```

- **指纹**:

    ```
    3F18 8883 8EAA E1A4 EA68 D2D7 3067 B770 E210 3FA6
    ```

- **创建时间**: `2026-03-23`
- **有效期至**: `2026-09-23`

新公钥已上传至 [keys.openpgp.org](https://keys.openpgp.org/vks/v1/by-fingerprint/3F1888838EAAE1A4EA68D2D73067B770E2103FA6) 公钥托管服务器，你可以直接通过以下命令从服务器拉取：

```bash
gpg --keyserver keys.openpgp.org --recv-keys 3F1888838EAAE1A4EA68D2D73067B770E2103FA6
```

你也可以[直接下载此公钥](/xingwangzhe_public.asc)。

### 公钥交换说明

很抱歉无法逐一通知所有联系人，因此通过博客发布此公告。

如果你希望与我**交换 GPG 公钥**进行加密通信，请**不要**直接将你的公钥发在评论区。正确流程如下：

```mermaid
sequenceDiagram
    participant 你
    participant 我

    你->>我: 使用我的新公钥加密邮件
    你->>我: 附上你的GPG公钥 + 交换说明
    Note over 我: 拉取并验证你的公钥
    我->>你: 使用你的公钥加密回信
    Note over 你,我: 交换完成 ✓<br/>后续通信全程加密
    Note right of 你: 禁止直接在评论区<br/>粘贴公钥明文
```
