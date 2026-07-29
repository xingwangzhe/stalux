---
source: Quake III Arena
link: https://en.wikipedia.org/wiki/Fast_inverse_square_root
sourceDate: "1999"
date: "2026-06-18 20:45:00"
draft: false
title: Fast inverse square root
abbrlink: quake3-fast-inv-sqrt
tags:
    - Technology
    - Programming
    - Mathematics
---

The most famous bitwise hack in gaming history — the fast inverse square root, specifically designed to accelerate `1 / sqrt(x)` in vector normalization:

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

Combined with vector length, you can directly compute normalized normals, and back in the day it was much faster than the standard library.
