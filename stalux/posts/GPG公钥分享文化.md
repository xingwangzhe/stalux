---
title: GPG公钥分享文化
abbrlink: f74e64e5
date: "2025-08-20T08:05:22.148+08:00"
updated: "2025-08-20T09:18:46.346+08:00"
categories:
  - 安全
tags:
  - GPG
  - 公钥
---

最近这几天看各个博客，发现大家都在分享自己的 **GPG** 公钥，我觉得很有趣，所以我也准备加入。

## GPG公钥分享文化从何而来

### GPG公钥分享文化的历史脉络

1. **密码学平民化的思想基石：密码朋克（Cypherpunks）**

**密码朋克运动**诞生于1990年代初期，主张"**通过密码学来实现社会和政治变革**"。成员们认为**强加密工具应该属于人民**，个人应拥有隐私和匿名通信的权利。这种"**自己掌握安全**"的理念成为公钥分享文化的精神内核。他们不仅讨论理论，更亲自编写代码、发布工具。**PGP**（Pretty Good Privacy）就是由菲尔·齐默尔曼在1991年编写并免费发布的，推动了加密工具的普及。

2. **技术基石：PGP与Web of Trust（信任网络）**

**PGP的核心创新是信任网络**（Web of Trust, WoT）模型。用户可以为朋友的公钥签名，成为其身份的"**担保人**"，实现**去中心化的信任认证**。**密钥签名派对**（Key Signing Party）成为社区成员线下验证身份、交换和签名密钥的社交仪式，强化了社区纽带。

3. **基础设施的诞生：密钥服务器（Keyserver）**

随着PGP用户增多，大学和志愿者维护的**公钥服务器**应运而生。早期密钥服务器强调"**上传即永久**"，体现了对系统完整性的高度重视。密钥服务器的**开放性和全球性**，展现了互联网早期"**信息自由流动**"的理想。

4. **开源运动与Linux的推动**

1999年，**GPG**（GNU Privacy Guard）作为PGP的开源替代品诞生，并与Linux生态深度集成。**GPG签名**成为开源世界的软件包、镜像、代码提交等流程的标准实践，推动了GPG公钥文化在开发和生产领域的普及。

5. **现实威胁的催化：斯诺登事件**

2013年**斯诺登事件**让大众意识到大规模监控的现实存在，加密工具需求激增。虽然GPG门槛较高，但在**电子邮件加密**和**软件供应链安全**领域依然不可替代，其文化在这些专业领域进一步巩固。

> **尽管中国大陆没有普遍使用电子邮件的习惯，但GFW等审查技术又弥补了这一点，于是GPG公钥文化反倒是有了土壤**😄

## 实践：创建自己的GPG密钥

### 导出公私钥

下面用**虚构的 Key ID 与邮箱**演示流程，实际操作时只需把示例值替换成你自己的即可。

---

导出 GPG 公私钥（文本格式）备忘

1. 查看自己有哪些密钥（找到 Key ID）

   ```bash title="bash"
   gpg --list-secret-keys --keyid-format LONG
   ```

   假设看到的 Key ID 是 `AABBCCDD12345678`。

2. 导出公钥（\*.asc，纯文本）

   ```bash title="bash"
   gpg --armor --export AABBCCDD12345678 > public.asc
   ```

   文件内容以  
   `-----BEGIN PGP PUBLIC KEY BLOCK-----`  
   开头，可直接贴到 GitHub/Gitee 等平台。

3. 导出私钥（\*.asc，纯文本，务必保管好）
   ```bash title="bash"
   gpg --armor --export-secret-keys AABBCCDD12345678 > private.asc
   ```
   文件内容以  
   `-----BEGIN PGP PRIVATE KEY BLOCK-----`  
   开头，导入/备份时使用：
   ```bash title="bash"
   gpg --import private.asc
   ```

> **安全提示**
>
> - 私钥文件请存放在加密存储介质。
> - 不要上传到云盘、邮件或公开仓库。

### Git 配置 GPG 签名简明三步法（示例版）

1. **指定签名密钥**

   ```bash title="bash"
   git config --global user.signingkey AABBCCDD12345678
   ```

2. **默认启用签名**

   ```bash title="bash"
   git config --global commit.gpgsign true
   ```

3. **上传公钥到平台**
   ```bash title="bash"
   gpg --armor --export AABBCCDD12345678 | xclip -sel clip
   ```
   把剪贴板内容粘贴到 GitHub / Gitee 的「GPG 公钥」设置页即可。

完成后，所有新 commit 都会自动带有 GPG 签名，并在平台显示绿色 **Verified** 标识。

## 我的公钥

详情请在[**about**](/about)中查看。

## 参考文献

- [GPG Tools 官方文档](https://gpgtools.tenderapp.com/kb)
- [GNU Privacy Guard 官方网站](https://gnupg.org/)
- [Wikipedia: Pretty Good Privacy](https://en.wikipedia.org/wiki/Pretty_Good_Privacy)
- [The Cypherpunks Mailing List Archives](https://cypherpunks.ca/)
- [Git Tools - Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work)
