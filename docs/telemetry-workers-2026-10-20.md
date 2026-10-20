# 路由切换与统计 Worker 验证（2026-10-20）

本次保留原生统计 SDK，改用官方 Clarity npm 入口，并将 Google 手动 `page_view` 的同步处理移出路由内容首帧任务。Partytown 1.0.1 的 Clarity 短流程成功，但连续导航的页身份覆盖不足，因此本版不恢复默认 Worker 迁移。

## 主线程成本与本版处理

原生 SDK 加载后的 `dataLayer.push` 会立即执行 Google 的事件处理，不能按初始化时普通数组入队的成本理解。本轮 CPU 采样在 Google 用户数据检测、正文节点遍历与 Clarity DOM 采集中发现明显工作；`async` 和低网络优先级不会自动将这些计算移到 Worker。

主题在 `astro:page-load` 捕获当页 URL、标题和虚拟 referrer，保留队列顺序；等待该页及当前页面共享的内容 `ready`：原生绘制抑制已经解除，页面自身动画已安装或明确跳过。经过两次动画帧后，再运行独立的低优先级任务。新 swap 会使旧任务失效并重新排队，隐藏和离开文档时同步清空待发页面事件。无后台任务 API 时使用宏任务，并保留有界兜底。内容动画为 100 ms；GA 不额外等待整段动画 `finished`。

这项修改移动了关键路径中的工作，**不代表减少 Google SDK 总 CPU，也不代表已经把它移到 Worker**。SDK 仍保持原生加载、自动事件和会话能力；主题不通过关闭真实统计来提高性能分数。SPA 的 URL、标题与 referrer 需要按每次虚拟页面更新，参见 [Google SPA 测量指南](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)。

Clarity 通过客户端动态导入官方 `@microsoft/clarity@1.0.2`，使用真实站点配置初始化一次；同一会话复用加载流程，删除旧的手工 tag loader 和主题自行构造的 Clarity queue。官方包仍插入远端 tag 与核心脚本，**安装 npm 包不等于 Worker 迁移或降低 DOM 采集 CPU**。本次检查的 0.8.72-beta 核心使用 `CompressionStream`，不能据此宣称它自带压缩 Worker。

主题只监控本集成通过官方初始化新插入的 script：error 或 15 秒超时后移除该次未完成的 loader，允许后续页面重试；已载入或由其他代码安装的 script 保留。tag 的 load 事件不代表远端核心已经运行，更不证明 collect 或后台报表成功。集成不添加 consent、identify 或自建用户 ID。官方入口见 [Microsoft Clarity npm 集成说明](https://clarity.microsoft.com/blog/npm-integration/)。

## Partytown 最新版本的实际结果

本轮直接核对 npm 官方 registry：`@qwik.dev/partytown` 为 1.0.1。`@astrojs/partytown` 最新仍为 2.1.8，依赖 Partytown `^0.14.4`，两者不能混称同一测试版本。

实验使用真实消费项目完整生产产物的独立实体副本。仅在实验中迁移 Clarity，其余统计保持原生；使用系统 Chrome、390×844 手机视口、4 倍 CPU 限速和真实收集服务，不拦截或伪造统计响应。每次导航、网络状态和异常即时保存；连续导航设置单次及总时限。

| 场景 | 观察结果 | 可以得出的结论 |
| --- | --- | --- |
| Clarity Worker，归档 → 重文章 → 归档 | Worker 内实际加载 tag 与 Clarity 0.8.72-beta 核心；同会话页身份 1–3，4 个 collect HTTP 204，0 页面异常 | 新版短流程可以工作，不能笼统说 Clarity 不支持 Partytown |
| Clarity Worker，60 次连续真实导航 | 60 次路由均完成，额外等待 10 秒后，同一个会话只观察到页身份 1–35；37 个 collect HTTP 204 | 当前候选未证明覆盖初始页加 60 次导航的 61 个页面状态，未通过本轮页身份完整性验收 |
| 连续导航的 Envelope URL | 37 个 envelope 中，归档 27、首页 4、普通文章 2、重文章 4；实际页面状态分别为 31、10、10、10 | 后段记录偏向已经返回的归档，不能将数据准确性问题视为等待队列尚未处理完 |
| 连续导航的 SDK 异常 | 1 条 `null.sequence`；原生基线也出现同类 Clarity 消息，路由仍完成 | 单列第三方 SDK 限制，不把它当成 Worker 独有错误；该条未保留完整栈，不声称精确调用位置 |
| 原生 SDK，同样三步加文档退出 | 页身份 1–3，8 个 Clarity collect HTTP 204，0 Clarity 网络失败，0 页面异常 | 保留原生控制，避免只凭 Worker 的某个 abort 事件判断退出统计损失 |
| 原生 SDK，同 HTTP、SDK、路线与节奏的 60 次控制 | 60 次导航完成；同一会话页身份完整 1–61，首包类别精确为归档 31、首页／普通／重文章各 10；170 个 collect HTTP 204，0 Clarity 网络失败 | 在相同条件下得到完整页身份覆盖，强化 Worker 候选数据归属不足的结论；末尾额外 settle 因浏览器关闭未完成，不声称通过完整 settle 或退出阶段 |
| Google Worker 桥接实验 | 首轮桥接未打通，修正轮未完成且清理异常丢失部分中间状态 | 本轮未交付 GA Worker 迁移；不能据此断言 Partytown 不支持 GA |

Clarity 页身份不是 GA `page_view`，不能把 61 与 35 的差值直接叫作“丢了 26 个 GA 浏览”。同条件原生 60 次控制已经观察到完整 61 个页身份，每个身份首包的 URL 类别与真实访问准确对应；Worker 35 个身份首包却为归档 26、首页 3、普通文章 2、重文章 4。原生与 Worker 都出现过同类 `null.sequence`，不能用这一消息单独判断 Worker 兼容性。当前结论是此 Worker 候选未满足发布要求，并非所有版本与网站的通用兼容性判决。

原生控制首轮因远端核心 `ERR_CONNECTION_CLOSED` 未载入，44 次导航时中止并标为无效网络轮；没有将 0 collect 当成准确率。有效重跑先验证核心实际载入，再执行同样 60 次导航；核心版本与 Worker 都为 0.8.72-beta。有效重跑在最后 10 秒 settle 等待时浏览器关闭，但此前已持久化完整页身份 1–61 与对应首包，不能把这一覆盖阳性证据写成完整 settle 成功。

部分 Worker 收集请求同时记录到 HTTP 204 与后续 `ERR_ABORTED`；原生控制的 Google 请求也有 abort。不能将 abort 条数直接当成丢失数据包数量。**HTTP 204 只表示收集端接受请求，不证明后台报表已经入库**。

早期 Worker 候选由独立静态服务提供，正式原生路由性能基线由 Astro preview 提供，不能据此比较绝对时延。后来补充的原生页身份控制使用与 Worker 同一实体产物和静态 HTTP 服务，仅用于数据准确性对照。本轮不宣称严格的 Worker 性能收益或回退，也不把 Lighthouse TBT 作为真实 INP。

## 最终官方 npm 集成的业务验收

最终实体消费包使用 runtime revision 4、100 ms 内容动画与官方 Clarity npm 入口。手机视口与 4 倍 CPU 限速下，先等待 Clarity 核心、Google 对应测量运行时和 Umami 实际就绪，再执行 60 次真实可信点击，覆盖初始归档加导航的 61 个页面状态，最后完整等待 10 秒。保持所有真实统计配置和实际收集端，没有拦截成功响应。

| 检查 | 最终观察 |
| --- | --- |
| 真实访问 | 60 次可信点击、61 个页面状态，逐个访问路径与点击路径一致 |
| Google 手动事件与真实 collect | 均为 61 次；逐次完整 URL、标题、虚拟 referrer 与访问快照精确对应，顺序一致 |
| Umami 真实 collect | 61 次 HTTP 200；完整 URL、标题与虚拟 referrer 逐项对应 |
| 官方 Clarity 加载 | npm tag 与 0.8.72-beta 核心各加载一次，未重复插入 loader；166 个 collect 均记录 HTTP 204，0 Clarity 网络失败，0 页面异常 |
| Clarity 页面归属 | 按实际请求中每个匿名 `(session, page)` 首次出现的顺序核对，没有先按路径或编号排序；61 个首包 pathname 全部精确对应 61 次访问，首次 upload 序号均为 1 |
| Clarity 会话连续性 | 初始会话只有页编号 1；首次导航后另一个会话完整记录编号 1–60。原验收的“全程同一会话、编号 1–61”两项断言失败，保留原失败结果 |

这组证据支持最终集成的逐页归属及 GA/Umami 元数据准确性，**不支持宣称单会话门槛已经通过**。另存的派生核验只验证实际请求顺序中的 61 个匿名页身份及其首路径，没有改写原失败结果。Google 的 61 个请求均先记录 HTTP 204、后记录同一个 Request 的 `ERR_ABORTED`；这两种事件已经关联，不能算作 61 个丢包，也不能由 HTTP 响应推断报表入库。

会话字段索引经 [Clarity envelope 源码](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/data/envelope.ts)确认：匿名映射使用 sessionId，并非 userId。官方代码在 URL 改变时停止并重启采集；会话 cookie 由首次上传成功后保存，停止时会重置待处理上传。观测中初始首包的 HTTP 204 晚于旧页身份携带新 URL 的停止阶段上传，与“首次响应尚未确认就换页”的机制吻合。参见 [history](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/core/history.ts)、[upload](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/data/upload.ts) 和 [metadata](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/data/metadata.ts)。这些链接指向官方主分支，未锁定本轮 beta 构建；本轮没有采集 cookie 快照，**不能将机制匹配写成实验证明的 HTTP cookie 失败**。主题没有因此阻塞路由、调用私有会话接口或自行写 cookie。

配置的 50 ms 只是 page-load 后的最小等待。实际点击间隔为 1107–2916 ms，中位数 1748 ms；page-load 到下一点击中位数为 1294 ms，包含浏览器操作、页面任务和检查点开销。脚本未分别计时各个 await，因此不能精确归因于检查点、SDK 或点击可操作性等待，也不能把这组结果称为与旧 Worker 实验实际节奏严格相同的快速压力对照。

## Worker 的实际边界

Partytown 仍需通过主线程代理访问 DOM，其官方文档明确说明 DOM 操作会被节流；DOM 密集脚本并非迁移后就没有主线程成本。官方也说明页面退出时的 Worker 事件不可靠，GA4 的自动退出 `user_engagement` 有已知缺失，正常 `page_view` 成功不足以证明统计功能等价。参见 [Partytown Trade-Offs](https://partytown.qwik.dev/trade-offs/)。

Atomics 可缩短线程通信，但需要相应 COOP/COEP 响应头，还要验证评论、图片和其他跨域资源；本轮没有修改线上隔离策略。参见 [Partytown Atomics](https://partytown.qwik.dev/atomics/)。后续 Worker 候选需要同时通过准确页面归属、会话与退出行为、真实网络失败、跨浏览器以及相同 HTTP 条件下的性能对照，才能替换当前原生方案。
