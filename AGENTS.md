# Stalux development instructions

## Configuration and documentation release contract

Any new or changed user-facing configuration field must be handled as one change set:

1. Update the Zod schema and all runtime consumers.
2. Search every relevant Markdown document (`README.md`, `README_CN.md`, and `stalux/posts/*_config*.md`) and document the field, default/optional behavior, output surface, and privacy implications.
3. Add or update a focused build assertion for the generated public artifact. For JSON-LD/config changes, parse the generated HTML or JSON rather than relying only on TypeScript compilation.
4. Run `bun run fmt`, `bun run fmt:check`, `bun run lint`, `timeout 900 bun run build`, and `bun pm pack --dry-run`.
5. Bump the package version, commit the implementation and docs together, push the branch and annotated tag, wait for CI/npm visibility, then upgrade `myblog` and run two builds.

Do not add a configuration field only to satisfy a third-party score. It must have a real Stalux runtime consumer, documented semantics, and a safe static-site behavior. Do not document dynamic API, rate-limit enforcement, MCP, authentication, or other capabilities that a static deployment cannot actually provide.

## Search-engine submission guidance

Stalux 是主题源码仓库。搜索引擎提交通常属于消费主题的博客仓库，而不是主题仓库。处理线上博客时，要区分“IndexNow 接受通知”和“搜索引擎已经收录”，也不要把 OAuth token、refresh token、API key、密码或其他凭据写入源码。

### IndexNow

myblog 仓库 `/home/xingwangzhe/桌面/博客/myblog` 的 `public/` 目录包含已验证的 IndexNow key 文件：

```text title="myblog IndexNow key files"
public/c7852e354cdc4aae8fe2b3984eeae49d.txt
public/e2d755e6d8db4efabbbfdcf2a403769a.txt
public/f3b7969bca754c47b9a37ff077d7d297.txt
```

部署后，文件内容必须等于文件名，并且能通过 `https://xingwangzhe.fun/<key>.txt` 访问。发布文章后，可以提交 canonical URL：

```bash title="Submit a published myblog URL to IndexNow"
KEY='c7852e354cdc4aae8fe2b3984eeae49d'
URL='https://xingwangzhe.fun/posts/<abbrlink>/'
curl -fsS -o /tmp/indexnow-response -w 'HTTP %{http_code}\n' \\
  -X POST 'https://api.indexnow.org/indexnow' \\
  -H 'Content-Type: application/json; charset=utf-8' \\
  --data "{\"host\":\"xingwangzhe.fun\",\"key\":\"$KEY\",\"keyLocation\":\"https://xingwangzhe.fun/$KEY.txt\",\"urlList\":[\"$URL\"]}"
cat /tmp/indexnow-response
```

提交前先确认文章 URL 返回 `200`。IndexNow 的 `HTTP 200` 只证明通知被接受，不证明已经抓取或收录。

### Google Search Console 与 gcloud 的边界

普通博客文章使用 Google Search Console URL Inspection：打开 `https://search.google.com/search-console`，选择已验证的 `xingwangzhe.fun` 属性，检查完整 canonical URL，然后点击“请求编入索引”。这是外部提交动作；遇到 CAPTCHA、重新登录、二次验证或最终确认时必须交给用户。

本机当前只确认 `gcloud auth list` 显示 `xingwangzhe@outlook.com` 已登录，未确认 active GCP project。gcloud 登录状态不等于 Search Console 所有权，也不等于 Google Indexing API 权限。没有用户明确授权和已验证的 API 配置时，不要创建凭据、请求 OAuth scope、发送 URL 或声称已经通过 gcloud 提交。

### 验证

发布后分别检查文章 URL、canonical、robots、sitemap、IndexNow 响应和 Search Console 状态。把“submitted/accepted”“Google request submitted”和“indexed”作为三个不同状态记录。
