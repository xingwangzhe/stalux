---
title: 偷梁换柱，解决Ubuntu24.04安装Packet Tracer缺失依赖问题
abbrlink: 9fe82262
date: '2025-10-12T17:50:44.618+08:00'
updated: '2025-10-12T18:12:28.469+08:00'
categories:
- Packet Tracer
tags:
- Ubuntu
- Packet Tracer
---

## 引言

由于学校的计算机网络实验课指导书基于 **Windows**，而我默认使用 **Ubuntu**，为了适应实验要求，我下载了 **Packet Tracer**。发现官网版本 (8.2.2) 支持的是 **Ubuntu 22.04** 而非 **24.04**，安装时缺少依赖。经过一番折腾，通过“偷梁换柱”的方法，成功解决了依赖问题。

[Packet Tracer 下载页面](https://www.netacad.com/resources/lab-downloads?courseLang=zh-CN)

## 依赖欺骗全流程复盘

### 问题根源

**deb** 包的 **control** 文件中写死了 `Depends: libgl1-mesa-glx`，而 **Ubuntu 24.04** 的仓库已删除此过渡包，导致 **dpkg** 直接拒绝配置。

### 解决思路

既然 **dpkg** 只认包名，那就让系统出现一个名为 `libgl1-mesa-glx` 的空壳包，而真正干活的库早就装好了。

## 实操步骤

以下是逐条可复现的步骤：

1. **安装真实库**
   提供 `libGL.so.1`、`libGLX_mesa.so.0` 等实际文件，确保功能不缺。

   ```bash
   sudo apt install -y libgl1 libglx-mesa0 libxcb-xinerama0
   ```

2. **解除 apt 阻塞**
   将之前半拉子安装的 **packettracer** 清掉，使 **apt** 恢复可用。

   ```bash
   sudo apt --fix-broken install
   ```

3. **安装造包工具**

   ```bash
   sudo apt install -y equivs
   ```

4. **生成最小控制文件**

   ```bash
   cat >/tmp/libgl1-mesa-glx <<'EOF'
   Section: misc
   Priority: optional
   Standards-Version: 4.5.1
   Package: libgl1-mesa-glx
   Version: 23.0.4-0ubuntu1
   Maintainer: dummy <dummy@localhost>
   Description: Dummy transitional package for libgl1-mesa-glx
   EOF
   ```

5. **构建空壳 deb**

   ```bash
   equivs-build /tmp/libgl1-mesa-glx
   ```

   这将生成 `libgl1-mesa-glx_23.0.4-0ubuntu1_all.deb`。

6. **将空壳包装进系统**
   在 `/var/lib/dpkg/status` 中添加已安装记录，使 **dpkg** 依赖检查通过。

   ```bash
   sudo dpkg -i libgl1-mesa-glx_23.0.4-0ubuntu1_all.deb
   ```

7. **正式安装 Packet Tracer**

   ```bash
   sudo dpkg -i ./Packet_Tracer822_amd64_signed.deb
   ```

   此时不再报依赖错误，图标、菜单项、`/opt/pt` 目录一次性到位。

8. **验证**

   ```bash
   packettracer
   ```

   能弹出登录窗口即宣告成功。

## 核心要点

- 空壳包不含文件，仅提供“包名”供 **dpkg** 匹配；零副作用、易卸载。
- 真正驱动 **OpenGL** 的库（`libgl1`、`libglx-mesa0`）早已装齐，功能零缺失。
- 无需修改官方 **deb**，也无需重打包，一条链路线完成。

## 卸载方法（可选）

```bash
sudo dpkg -r libgl1-mesa-glx
```

空壳包瞬间消失，系统恢复原状。

至此，**Ubuntu 24.04** 用“狸猫换太子”完美运行官版 **Packet Tracer 8.2.2**，任务结束。
