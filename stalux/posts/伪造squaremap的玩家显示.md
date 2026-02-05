---
title: 伪造squaremap的玩家显示
abbrlink: 828e66c0
date: "2025-08-13T14:03:57.651+08:00"
updated: "2025-08-13T14:49:32.251+08:00"
categories:
  - minecraft
tags:
  - squaremap
  - minecraft
  - js
---

![fakeplayer位置显示](https://i.ibb.co/RGnPmym3/2025-08-11-23-41-55.webp)

## 前言

squaremap是我的世界知名的网页地图之一，它可以做到玩家位置的显示，服务端可以设置玩家是否显示，但是如果玩家不再显示到地图上，玩家自己又如何才能找到自己的位置呢？那么显然，我们需要修改前端才能实现

## squaremap玩家显示原理

通过分析squaremap的前端代码，我们可以了解到它通过定期从服务器获取玩家数据来显示玩家位置。主要的数据源是`players.json`文件，其中包含了所有在线玩家的信息。

从[https://map.\*\*\*.cn/tiles/players.json](https://map.***.cn/tiles/players.json)可以看到如下格式的数据：

```json title="players.json"
{
  "max": 200,
  "players": [
    {
      "world": "minecraft_overworld",
      "armor": 0,
      "name": "Comecat",
      "x": 267652,
      "y": 72,
      "health": 40,
      "z": -67070,
      "display_name": "Comecat",
      "uuid": "83691f9849133901819b0bc29ab5883e",
      "yaw": -91
    }
    // ... 更多玩家数据
  ]
}
```

## 前端实现机制

squaremap通过一个主类`SquaremapMap`来管理整个地图系统，其中包含了一个`PlayerList`组件来处理玩家相关的功能。

### 主要组件结构

在[squaremap.js](file:///home/xingwangzhe/桌面/staluxmyblog/node_modules/.pnpm/@types+node@18.19.50/node_modules/@types/node/stream/consumers.d.ts#L2-L2)中，主要初始化代码如下：

```javascript title="squaremap.js"
class SquaremapMap {
  constructor() {
    this.map = L.map("map", {
      crs: L.CRS.Simple,
      center: [0, 0],
      attributionControl: false,
      preferCanvas: true,
      noWrap: true,
    });
    // ... 其他初始化代码
  }
}
```

玩家列表功能由`PlayerList`类管理：

```javascript title="squaremap.js"
class PlayerList {
  constructor(json) {
    this.players = new Map();
    this.markers = new Map();
    this.following = null;
    this.firstTick = true;
  }

  tick() {
    if (P.tick_count % P.worldList.curWorld.player_tracker.update_interval == 0) {
      P.getJSON("tiles/players.json", (json) => {
        this.updatePlayerList(json.players);
        // ... 更新玩家列表标题
      });
    }
  }
}
```

### 玩家数据处理

每个玩家由`Player`类表示，包含以下主要功能：

```javascript title="squaremap.js"
class Player {
  constructor(json) {
    this.name = json.name;
    this.uuid = json.uuid;
    this.world = json.world;
    this.displayName = json.display_name !== undefined ? json.display_name : json.name;
    this.x = 0;
    this.z = 0;
    this.armor = 0;
    this.health = 20;

    // 创建地图标记
    this.marker = L.marker(P.toLatLng(json.x, json.z), {
      icon: L.icon({
        iconUrl: "images/icon/player.png",
        iconSize: [17, 16],
        iconAnchor: [8, 9],
        tooltipAnchor: [0, 0],
      }),
      rotationAngle: 180 + json.yaw,
    });
  }
}
```

## 实现自定义玩家位置显示

如果我们想要在玩家被服务器设置为不可见时仍能显示自己的位置，可以通过以下方式实现：

### 方法一：修改前端请求逻辑

我们可以通过拦截或修改前端请求，添加当前玩家的信息：

```javascript title="any.js"
// 在获取玩家数据后，手动添加当前玩家信息
function addCurrentPlayer(jsonData, currentPlayerData) {
  // 检查当前玩家是否已经在列表中
  const playerExists = jsonData.players.some((player) => player.uuid === currentPlayerData.uuid);

  // 如果不存在，则添加当前玩家
  if (!playerExists) {
    jsonData.players.push(currentPlayerData);
  }

  return jsonData;
}
```

### 方法二：本地存储玩家位置

另一种方法是在本地存储玩家的位置信息，并在请求时合并：

```javascript title="any.js"
// 保存玩家位置到本地存储
function savePlayerLocation(playerData) {
  localStorage.setItem(
    "myPosition",
    JSON.stringify({
      x: playerData.x,
      y: playerData.y,
      z: playerData.z,
      world: playerData.world,
      lastUpdate: Date.now(),
    }),
  );
}

// 从本地存储获取玩家位置并添加到玩家列表
function addLocalPlayerPosition(playersJson) {
  const localPosition = localStorage.getItem("myPosition");
  if (localPosition) {
    const position = JSON.parse(localPosition);
    // 检查数据是否过期（例如超过5分钟）
    if (Date.now() - position.lastUpdate < 5 * 60 * 1000) {
      // 创建一个虚拟玩家对象
      const virtualPlayer = {
        world: position.world,
        armor: 0,
        name: "You",
        x: position.x,
        y: position.y,
        health: 20,
        z: position.z,
        display_name: "You (Local)",
        uuid: "local-player",
        yaw: 0,
      };

      // 添加到玩家列表
      playersJson.players.push(virtualPlayer);
    }
  }
  return playersJson;
}
```

## WebmapView模组介绍

[WebmapView](https://github.com/xingwangzhe/webmapview) 是我开发的一个Fabric模组，允许玩家通过游戏内浏览器界面查看网页地图服务（如squaremap），支持自定义URL等功能。我依据此实现在后端创建api节点来实现java客户端向js前端传递玩家json数据。

### 关键代码结构

#### PlayerInformation类

PlayerInformation类负责收集和管理玩家信息：

```java title="PlayerInformation.java"

public class PlayerInformation {
    private String playerName;
    private double x, y, z;
    private String world;
    private float yaw, pitch;

    // 获取玩家信息的方法
    public static PlayerInformation getCurrentPlayerInfo() {
        PlayerEntity player = MinecraftClient.getInstance().player;
        PlayerInformation info = new PlayerInformation();
        info.playerName = player.getName().getString();
        info.x = player.getX();
        info.y = player.getY();
        info.z = player.getZ();
        info.world = player.getWorld().getRegistryKey().getValue().toString();
        info.yaw = player.getYaw();
        info.pitch = player.getPitch();
        return info;
    }
}
```

#### API接口类

API类提供将玩家信息传递给网页的方法：

```java title="API.java"
public class API {
    // 将玩家位置信息发送到网页
    public static void sendPlayerPosition(PlayerInformation info) {
        // 构造JavaScript代码
        String jsCode = String.format(
            "window.updatePlayerPosition && window.updatePlayerPosition(%f, %f, %f, '%s', %f, %f);",
            info.x, info.y, info.z, info.world, info.yaw, info.pitch
        );

        // 执行JavaScript代码
        BasicBrowser.executeJavaScript(jsCode);
    }
}
```

#### 浏览器实现类

BasicBrowser类负责管理嵌入的浏览器实例：

```java title="BasicBrowser.java"
public class BasicBrowser {
    private MCEFBrowser browser;

    public void loadMapUrl(String url) {
        if (browser != null) {
            browser.loadURL(url);
            // 注入自定义JavaScript代码以处理玩家位置更新
            injectPlayerPositionHandler();
        }
    }

    private void injectPlayerPositionHandler() {
        String jsCode = """
            // 创建更新玩家位置的函数
            window.updatePlayerPosition = function(x, y, z, world, yaw, pitch) {
                // 将玩家位置保存到本地存储
                localStorage.setItem('playerPosition', JSON.stringify({
                    x: x,
                    y: y,
                    z: z,
                    world: world,
                    yaw: yaw,
                    pitch: pitch,
                    timestamp: Date.now()
                }));

                // 如果页面上有squaremap实例，则更新地图中心点
                if (typeof P !== 'undefined' && P.map) {
                    var latlng = P.toLatLng(x, z);
                    P.map.setView(latlng, P.map.getZoom());
                }
            };

            // 定期检查本地存储中的玩家位置并更新地图
            setInterval(function() {
                var position = localStorage.getItem('playerPosition');
                if (position) {
                    var pos = JSON.parse(position);
                    // 仅在5秒内的位置数据有效
                    if (Date.now() - pos.timestamp < 5000) {
                        if (typeof P !== 'undefined' && P.map) {
                            var latlng = P.toLatLng(pos.x, pos.z);
                            // 添加特殊标记表示本地玩家
                            if (!window.localPlayerMarker) {
                                window.localPlayerMarker = L.marker(latlng, {
                                    icon: L.icon({
                                        iconUrl: 'images/icon/player_local.png',
                                        iconSize: [20, 19],
                                        iconAnchor: [10, 10]
                                    })
                                }).addTo(P.map);
                            } else {
                                window.localPlayerMarker.setLatLng(latlng);
                            }
                        }
                    }
                }
            }, 1000);
            """;

        executeJavaScript(jsCode);
    }

    public static void executeJavaScript(String jsCode) {
        // 执行JavaScript代码的具体实现
        // 这里会调用MCEF的相关API来执行JavaScript
    }
}
```

## 总结

当服务器隐藏玩家位置时的webmapview能够自我定位地图中的位置，方便了玩家的体验
