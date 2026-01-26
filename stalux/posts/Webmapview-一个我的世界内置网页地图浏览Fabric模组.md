---
title: Webmapview:一个我的世界内置网页地图浏览Fabric模组
abbrlink: 4628
date: 2025-01-12 19:02:28+00:00
updated: '2025-09-16T19:54:26.920+08:00'
categories:
- 开发
tags:
- 学习
- 记录
- 游戏
- 胡思乱想
- 进步
---

## webmapview

[xingwangzhe/webmapview](https://github.com/xingwangzhe/webmapview)

<!--more-->

:::info

本模组遵循GPL3.0 MIT协议

GPL3.0协议优先

:::

<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113815123401875&bvid=BV1xwc3eNE2g&cid=27831174746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" width="800px" height="500px"></iframe>

### 为什么要开发这一个模组

因为我懒得在浏览器打开页面

### 挑战:我的世界并不能原生渲染web

这是正常的，查资料，我的世界基于opengl，但网页一般是webgl。这就意味着，我既不能用minecraft原生方法来写，也不可能用fabric api或者其他模组api来写。难道就此止步了吗？不，既然我不会造轮子，那我只好找轮子了，经历一番搜索，我终于找到了一个合适的依赖
[[MCEF]Minecraft Chromium嵌入式框架 (Minecraft Chromium Embedded Framework) - MC百科|最大的Minecraft中文MOD百科](https://www.mcmod.cn/class/592.html)

### 稍微改造轮子，实现我想要的效果

由于这个项目有个示例模组，已经实现了web对象，那么我只需要替换url就行了

[CinemaMod/mcef-fabric-example-mod: Example MCEF Fabric mod](https://github.com/CinemaMod/mcef-fabric-example-mod)

很高兴作者用了CC0协议。虽然表明已经投入公共领域，但我还是注明一下来源

#### 改造后的BasicBrowser.java

```java
//copy from https://github.com/CinemaMod/mcef-fabric-example-mod and change by xingwangzhe

public class BasicBrowser extends Screen {
    private static final int BROWSER_DRAW_OFFSET = 20;

    private MCEFBrowser browser;

    private final MinecraftClient minecraft = MinecraftClient.getInstance();

    public BasicBrowser(Text title) {
        super(title);
    }

    @Override
    protected void init() {
        super.init();
        if (browser == null) {
            String url = UrlManager.fullUrl(UrlManager.defaultUrl);
            sendFeedback(url);
            boolean transparent = true;
            browser = MCEF.createBrowser(url, transparent);
            resizeBrowser();
        }
    }
```

下面就得解释一下关键的方法

### UrlManager对象

关键在于实现对url的管理

```java

public class UrlManager {
    private static final String URL_FILE_NAME = "urls.txt"; // 存储URL列表的文件名
    private static final String DEFAULT_URL_FILE_NAME = "default_url.txt"; // 默认URL文件名
    private static List<String> urlList = new ArrayList<>(); // 存储URL的列表
    public static String defaultUrl="squaremap-demo.jpenilla.xyz"; // 默认URL
    public static boolean webmapview=true;
    static {
        loadUrls();
        loadDefaultUrl();
    }
    /**
     * 添加一个URL到列表中并保存到文件。
     * @param url 要添加的URL字符串
     */
    public static void addUrl(String url) {
        if (!urlList.contains(url)) { // 确保不重复添加相同的URL
            urlList.add(url);
            saveUrls(); // 保存更新后的URL列表到文件
            sendFeedback(Text.translatable("feedback.url.added", url)); // 向玩家发送反馈
        } else {
            sendFeedback(Text.translatable("feedback.url.exists", url)); // 如果URL已存在，则通知玩家
        }
    }

    /**
     * 设置默认URL。
     * @param url 要设置为默认的URL字符串
     */
    public static void setDefaultUrl(String url) {
        if (urlList.contains(url)) { // 确保URL已经存在于列表中
            defaultUrl = url;
            saveDefaultUrl(); // 更新默认URL到文件
            sendFeedback(Text.translatable("feedback.default.url.updated", url)); // 向玩家发送反馈
        } else {
            sendFeedback(Text.translatable("feedback.url.not_found", url)); // 如果URL不存在于列表中，则通知玩家
        }
    }

    /**
     * 获取当前的URL列表。
     * @return 包含所有URL的列表
     */
    public static List<String> getUrlList() {
        return urlList;
    }

    /**
     * 获取默认URL。
     * @return 默认URL字符串
     */
    public static String getDefaultUrl() {
        return defaultUrl;
    }

    /**
     * 将当前的URL列表保存到文件中。
     */
    private static void saveUrls() {
        Path configPath = getConfigDirectory().resolve(URL_FILE_NAME); // 获取配置文件路径
        try (BufferedWriter writer = Files.newBufferedWriter(configPath)) { // 使用try-with-resources确保资源关闭
            for (String url : urlList) {
                writer.write(url); // 写入单个URL
                writer.newLine(); // 换行以便每个URL占一行
            }
        } catch (IOException e) {
            e.printStackTrace(); // 打印异常信息
        }
    }

    /**
     * 从文件加载URL列表。
     */
    private static void loadUrls() {
        Path configPath = getConfigDirectory().resolve(URL_FILE_NAME); // 获取配置文件路径
        urlList.clear(); // 清空现有列表以准备加载新数据
        if (Files.exists(configPath)) { // 如果文件存在，则读取它
            try (BufferedReader reader = Files.newBufferedReader(configPath)) { // 使用try-with-resources确保资源关闭
                String line;
                while ((line = reader.readLine()) != null) { // 循环读取每一行
                    urlList.add(line); // 将每行作为一个URL添加到列表中
                }
            } catch (IOException e) {
                e.printStackTrace(); // 打印异常信息
            }
        }
    }

    /**
     * 保存默认URL到文件。
     */
    private static void saveDefaultUrl() {
        Path defaultUrlPath = getConfigDirectory().resolve(DEFAULT_URL_FILE_NAME); // 获取默认URL文件路径
        try (BufferedWriter writer = Files.newBufferedWriter(defaultUrlPath)) { // 使用try-with-resources确保资源关闭
            if (defaultUrl != null && !defaultUrl.trim().isEmpty()) {
                writer.write(defaultUrl); // 写入默认URL
            } else {
                // 如果没有有效的默认URL，则删除默认URL文件（如果存在）
                Files.deleteIfExists(defaultUrlPath);
            }
        } catch (IOException e) {
            e.printStackTrace(); // 打印异常信息
        }
    }

    /**
     * 从文件加载默认URL。
     */
    private static void loadDefaultUrl() {
        Path defaultUrlPath = getConfigDirectory().resolve(DEFAULT_URL_FILE_NAME); // 获取默认URL文件路径
        if (Files.exists(defaultUrlPath)) { // 如果文件存在，则读取它
            try (BufferedReader reader = Files.newBufferedReader(defaultUrlPath)) { // 使用try-with-resources确保资源关闭
                String line;
                if ((line = reader.readLine()) != null) { // 只读取第一行
                    defaultUrl = line; // 设置默认URL
                }
            } catch (IOException e) {
                e.printStackTrace(); // 打印异常信息
            }
        }
    }

    /**
     * 获取配置目录路径。
     * @return Minecraft配置目录下的路径
     */
    private static Path getConfigDirectory() {
        Path configDir = FabricLoader.getInstance().getConfigDir();
        try {
            Files.createDirectories(configDir); // 如果目录不存在，则创建之
        } catch (IOException e) {
            e.printStackTrace();
        }
        return configDir;
    }

    /**
     * 发送反馈信息到聊天栏。
     * @param message 要发送的消息
     */
    public static void sendFeedback(String message) {
        MinecraftClient.getInstance().player.sendMessage(Text.of(message), false);
    }
    public static void sendFeedback(Text textMessage) {
        if (MinecraftClient.getInstance().player != null) {
            MinecraftClient.getInstance().player.sendMessage(textMessage, false);
        }
    }
    public static void removeUrl(String url) {
        if (urlList.remove(url)) { // 如果成功移除URL
            saveUrls(); // 保存更新后的URL列表到文件

            // 如果被删除的URL是默认URL，则清除默认URL设置
            if (defaultUrl != null && defaultUrl.equals(url)) {
                clearDefaultUrl();
            }

            sendFeedback(Text.translatable("feedback.url.removed", url)); // 向玩家发送反馈
        } else {
            sendFeedback(Text.translatable("feedback.url.not_found", url)); // 如果URL不存在，则通知玩家
        }
    }

    /**
     * 清除默认URL设置。
     */
    private static void clearDefaultUrl() {
        defaultUrl = null;
        Path defaultUrlPath = getConfigDirectory().resolve(DEFAULT_URL_FILE_NAME); // 获取默认URL文件路径
        try {
            Files.deleteIfExists(defaultUrlPath); // 删除默认URL文件（如果存在）
        } catch (IOException e) {
            e.printStackTrace(); // 打印异常信息
        }
    }

    public static String fullUrl(String baseUrl) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null || client.world == null|| webmapview==false ) {
            sendFeedback(Text.translatable("feedback.player_or_world_not_available")); // 使用翻译文本
            return baseUrl; // 如果无法获取玩家或世界信息，则返回原始URL
        }

        // 获取玩家坐标并转换为整数
        int playerX = (int) client.player.getX();
        int playerZ = (int) client.player.getZ();

        // 获取玩家所在的世界名称
        String worldName = client.world.getRegistryKey().getValue().toString();
        if(Objects.equals(worldName, "minecraft:overworld")){
            worldName = "world";
        } else if (Objects.equals(worldName, "minecraft:the_nether")){
            worldName = "world_nether";
        } else if (Objects.equals(worldName, "minecraft:the_end")){
            worldName = "world_the_end";
        }

        // 构建完整的URL
        StringBuilder fullUrlBuilder = new StringBuilder("https://").append(baseUrl).append("/"); // 添加协议头
        if (!baseUrl.contains("?")) { // 检查是否已有参数
            fullUrlBuilder.append("?");
        } else {
            fullUrlBuilder.append("&"); // 如果已经有参数，则使用&连接
        }
        fullUrlBuilder.append("x=").append(playerX)
                .append("&z=").append(playerZ)
                .append("&zoom=").append("4")
                .append("&world=").append(worldName);

        return fullUrlBuilder.toString();
    }
}

```

### 初始化，注册命令绑定按键

```java
public class WebmapviewClient implements ClientModInitializer {

    private static CompletableFuture<Suggestions> suggestUrls(CommandContext<?> context, SuggestionsBuilder builder) {
        List<String> urls = UrlManager.getUrlList();
        urls.forEach(builder::suggest);
        return builder.buildFuture();
    }
    private KeyBinding keyBinding;
    @Override
    public void onInitializeClient() {
//        ClientTickEvents.START_CLIENT_TICK.register((client) -> onTick());
        // 注册“addturl”命令，用于添加新的URL
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> {
            dispatcher.register(
                    ClientCommandManager.literal("urladd")
                            .then(ClientCommandManager.argument("url", StringArgumentType.string())
                                    .executes(context -> {
                                        String url = StringArgumentType.getString(context, "url");
                                        UrlManager.addUrl(url); // 添加URL
                                        return 1; // 命令成功执行
                                    })
                            )
            );

            // 注册“removeurl”命令，用于删除URL
            dispatcher.register(
                    ClientCommandManager.literal("urlremove")
                            .then(ClientCommandManager.argument("url", StringArgumentType.string()).suggests(WebmapviewClient::suggestUrls)
                                    .executes(context -> {
                                        String url = StringArgumentType.getString(context, "url");
                                        UrlManager.removeUrl(url); // 删除URL
                                        return 1; // 命令成功执行
                                    })
                            )
            );

            // 注册“urllist”命令，用于列出所有已添加的URL
            dispatcher.register(
                    ClientCommandManager.literal("urllist")
                            .executes(context -> {
                                List<String> urls = UrlManager.getUrlList(); // 获取所有URL
                                StringBuilder listMessage = new StringBuilder("Available URLs:\n");
                                for (int i = 0; i < urls.size(); i++) {
                                    listMessage.append(i + 1).append(": ").append(urls.get(i)).append("\n"); // 格式化输出
                                }
                                context.getSource().sendFeedback(Text.of(listMessage.toString())); // 向玩家展示结果
                                return 1; // 命令成功执行
                            })
            );
            // 注册“urlset”命令，用于设置默认URL
            dispatcher.register(
                    ClientCommandManager.literal("urlset")
                            .then(ClientCommandManager.argument("url", StringArgumentType.string()).suggests(WebmapviewClient::suggestUrls)
                                    .executes(context -> {
                                        String url = StringArgumentType.getString(context, "url");
                                        UrlManager.setDefaultUrl(url); // 设置默认URL
                                        return 1; // 命令成功执行
                                    })
                            )
            );
            dispatcher.register(
                    ClientCommandManager.literal("webmapviewoption")
                            .then(ClientCommandManager.argument("url", StringArgumentType.string())
                                    .executes(context -> {
                                        UrlManager.webmapview = !UrlManager.webmapview;
                                        if (UrlManager.webmapview) {
                                            sendFeedback("webmapview is enabled");
                                        } else {
                                            sendFeedback("webmapview is not enabled");
                                        }

                                   return 1; })
                            )
            );
            dispatcher.register(
                    ClientCommandManager.literal("webmapview")
                            .then(ClientCommandManager.literal("help")
                                    .executes(context -> {
                                        StringBuilder helpMessage = new StringBuilder();
                                        helpMessage.append("/urladd: ").append(Text.translatable("command.urladd.description").getString()).append("\n")
                                                .append("/urlremove: ").append(Text.translatable("command.urlremove.description").getString()).append("\n")
                                                .append("/urllist: ").append(Text.translatable("command.urllist.description").getString()).append("\n")
                                                .append("/urlset: ").append(Text.translatable("command.urlset.description").getString()).append("\n")
                                                .append("/webmapviewoption: ").append(Text.translatable("command.webmapviewoption.description").getString()).append("\n");
                                        ;
                                        sendFeedback((helpMessage.toString()) );
                                        return 1;
                                    })
                            )
            );
        });

        // 初始化KeyBinding
        keyBinding = new KeyBinding(
                "key.webmapview.open_basic_browser",  // 使用唯一标识符
                GLFW.GLFW_KEY_H,                      // 默认按键
                "category.webmapview"                       // 分类
        );

        // 注册KeyBinding
        KeyBindingHelper.registerKeyBinding(keyBinding);

        final MinecraftClient minecraft = MinecraftClient.getInstance();
        // 监听客户端tick事件，处理按键输入
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (keyBinding.wasPressed()) {
                if (!(minecraft.currentScreen instanceof BasicBrowser)) {
                    minecraft.setScreen(new BasicBrowser(
                            Text.literal("Basic Browser")
                    ));
                }
            }
        });
    }
    }
```

## 感悟

### 困难也重重

由于我是计算机专业的，虽然我没系统性地学习java，但条件控制语句，oop什么的基本上还是会的。但关键问题在于

#### 事件过程应该是什么

就拿检测是否按下按键来说吧，我以为用if就行，没想到需要使用while()来实现监听，光这一点就卡了我很长时间，

> 我可算知道为什么模组一多就占内存了，事件占用太多了😀。

显然，我不能简单地想象时间的流程，不然我找不到对应地api。很多模组教学没有提到这一点，他们只会一味地提及去查wiki,但问题在于我的想法太简化/复杂， **根本找不全应有的**的函数方法。

#### 调试再调试，报错再报错

每一次改代码，都需要重载，虽然耗时，但无可避免。调试的时候,依赖依赖找不到，有时候莫名其妙还得重新构建一下，历史信息太过沉重，以至于找到很多废弃的api :(

:::error
在我尝试mcef之前，使用的非我的世界相关依赖更是，一言难尽.....
只能说我确实不懂java工程
:::

~~想打印信息，发现好多都可以打印，有点感觉到回字的四种写法~~

### 收获亦颇丰

#### 了解到了一些概念

比如说数据持久化，我需要把urls放在txt里面，这样下次打开游戏可以直接用，如果只是写在内存里，关了游戏，数据自然就消失了

```java
private static final String URL_FILE_NAME = "urls.txt"; // 存储URL列表的文件名
    private static final String DEFAULT_URL_FILE_NAME = "default_url.txt"; // 默认URL文件名
    private static List<String> urlList = new ArrayList<>(); // 存储URL的列表
    public static String defaultUrl="squaremap-demo.jpenilla.xyz"; // 默认URL
    public static boolean webmapview=true;
```

#### 工程规范

稍微了解了一下gradle,ai还提了一下maven，默认src是资源，规定i18n要写在lang文件夹下等等。学了这些，我想我不只能看懂自己的模组工程，也能看懂别人的

#### java

是的，亲手敲代码确实能锻炼java功底，说不定毕业我就是拥有三年工作经验的jvav工程师了😂
