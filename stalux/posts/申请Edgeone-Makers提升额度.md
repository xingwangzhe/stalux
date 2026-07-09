---
title: "申请 Edgeone Makers 提升额度"
abbrlink: apply-edgeone-makers
date: "2026-07-09 16:00:00"
updated: "2026-07-09 16:00:00"
desc: "搞博客宇宙没留意 Agent 自动 push 触发 EdgeOne CI，额度爆了，只能填超长表单申请提升"
categories:
    - 折腾
tags:
    - edgeone
    - makers
    - CI
    - 额度
    - 博客宇宙
cover: /edgeone/手机截屏申请提高edgeone构建额度记录.webp
---

我最近搞[**博客宇宙**](https://links.needhelp.icu)，没注意 `Agent` 老师老是自动 `push` 到仓库触发 EdgeOne 的 `CI`，没想到**超过额度**了，于是我就申请去了。

![超长页的申请](/edgeone/手机截屏申请提高edgeone构建额度记录.webp)

---

没想到 **成功了** 🎉，以后可不敢乱去 `push` 浪费 Pages 平台的构建次数了！

顺手检索了一下，各个平台免费版的 `CI` 构建次数额度如下👇

| 平台                 | 免费计划名称       | CI / 构建限制                                                                                   | 额外说明                                                                       | 参考来源                                                                                              |
| -------------------- | ------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Vercel**           | Hobby              | 官方定价页未明确列出 Hobby 的 build minutes 硬数字；第三方评测称约 **6,000 build minutes/月**   | 1 个并发构建；100 次部署/天；仅限个人非商业用途                                | [Vercel 官方定价](https://vercel.com/pricing)                                                         |
| **Netlify**          | Free / Starter     | **300 credits/月**（Production deploy 每次消耗 15 credits，约等价于 300 build minutes）         | 超出后站点进入暂停状态；1 个并发构建                                           | [Netlify 官方定价](https://www.netlify.com/pricing/)                                                  |
| **Cloudflare Pages** | Free               | **500 builds/月**                                                                               | 1 个并发构建；无限带宽；100 个自定义域名/项目                                  | [Cloudflare Pages 官方](https://pages.cloudflare.com/)                                                |
| **GitHub Pages**     | Free（公开仓库）   | **10 builds/小时**（软限制）                                                                    | 单次构建 10 分钟超时；100 GB/月 带宽；1 GB 站点大小                            | [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)  |
| **GitLab Pages**     | Free（GitLab.com） | **400 CI minutes/月/组**（私有仓库）                                                            | 公开仓库可通过 OSS 计划申请更多；Pages 本身无额外构建限制，消耗 GitLab CI 额度 | [cicdcalculator.com](https://cicdcalculator.com/free-ci-cd-platforms)                                 |
| **Render**           | Free               | **500 build minutes/月**                                                                        | 静态站点不 sleep；Web Service 15 分钟无活动后 sleep；100 GB 带宽               | [deploybase.app](https://deploybase.app/blog/render-free-tier-complete-guide-2026)                    |
| **Railway**          | Free / Trial       | 无明确 "build minutes" 配额，按 **usage-based** 计费；Trial 含 \$5 一次性额度，Free 计划 \$1/月 | 构建时间按 CPU/RAM 消耗 credits；30 天 Trial 后需升级或转入 Free 计划          | [Railway 官方定价](https://railway.com/pricing)                                                       |
| **Firebase Hosting** | Spark（免费）      | **无内置 CI 构建分钟限制**（Hosting 本身只提供托管，CI 需配合 GitHub Actions 等外部工具）       | 1 GB 存储；10 GB/月 传输流量；需配合 Blaze 计划才支持 Cloud Functions          | [Scrimba 2026 Firebase 指南](https://scrimba.com/articles/best-firebase-tutorials-and-projects-2026/) |
| **AWS Amplify**      | Free Tier          | **1,000 build minutes/月**                                                                      | 5 GB 存储；超出后 \$0.01/build minute                                          | [urancompany.com](https://urancompany.com/blog/aws-amplify-and-serverless-web-development)            |
| **Surge.sh**         | Free               | **无明确限制**（Unlimited publishing）                                                          | 仅支持静态站点；自定义域名免费；SSL 仅对 \*.surge.sh 子域名自动提供            | [sunlightmedia.org](https://sunlightmedia.org/using-surge-for-deploying-static-sites/)                |

下次可不能浪费了，**省着点用吧** 😅
