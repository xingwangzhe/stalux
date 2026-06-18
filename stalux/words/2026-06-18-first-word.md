---
source: "Quake III Arena"
link: "https://baike.baidu.com/item/%E5%B9%B3%E6%96%B9%E6%A0%B9%E5%80%92%E6%95%B0%E9%80%9F%E7%AE%97%E6%B3%95/4075273"
sourceDate: "1999"
date: "2026-06-18 20:45:00"
draft: false
---

游戏界最著名的一段位运算黑科技——快速反平方根，专门用来加速向量归一化里的 `1 / sqrt(x)`：

```c
float Q_rsqrt(float number)
{
    long i;
    float x2, y;
    const float threehalfs = 1.5f;

    x2 = number * 0.5f;
    y  = number;

    i  = *(long *)&y;            // evil floating point bit level hacking
    i  = 0x5f3759df - (i >> 1);  // what the fuck?
    y  = *(float *)&i;

    y  = y * (threehalfs - (x2 * y * y));   // 1st iteration

    return y;
}
```

配合向量长度就能直接算归一化法线，当年可比标准库快得多。
