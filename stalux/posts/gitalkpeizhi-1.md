---
title: 在hexo-next配置gitalk
abbrlink: 8403dd78
date: 2024-09-20 18:58:27+00:00
updated: "2024-09-20 18:58:30"
categories:
  - hexo
tags:
  - 记录
  - hexo
  - gitalk
  - 教程
---

## <div style="text-align: center;">如何在hexo-next配置gitalk评论</div>

你是否也想在你的博客里面添加这样的评论区？
![gitalk](https://i.ibb.co/NDpYcPs/gitalk.png)
那就快来看以下教程吧：）

<!--more-->

打开[github][1],点击右上角的图片，选择Settings,然后在左边栏最下方找到Developer settings并点击，然后在左边栏找到OAuth Apps选中点击，主页面右上角有new OAuth App
点击创建新OAuth Apps，输入必要参数，记录ID,创建密码，记得复制，然后转到blog\themes\next下的\_config.yml文件修改其中的配置，转到[cloudflare][2]配置worker,然后就大功告成了，不过光听我讲没用，看图更容易理解，所以请一步一步按图片示意做:

### 在github上创建OAuth Apps

![scene1](https://i.ibb.co/XM3G3v5/scene1.png)
![scene2](https://i.ibb.co/JwXdCZ2R/scene2.png)
![scene3](https://i.ibb.co/XfbF7JJ0/scene3.png)
![scene4](https://i.ibb.co/xSts8qLV/scene4.png)
![scene5](https://i.ibb.co/d4yPc28D/scene5.png)
![scene6](https://i.ibb.co/hFwpXNbr/scene6.png)
![scene7](https://i.ibb.co/zH4bFqWv/scene7.png)
![scene8](https://i.ibb.co/TBT584xK/scene8.png)
可以先用文本编辑器创建txt文件记录Client id和secrets

> **切记不要把Client id和secrets泄露给他人！这里仅作演示，此测试OAuh Apps已删除**

---

### 转到blog\themes\next下的\_config.yml文件修改其中的配置

```yml
## ---------------------------------------------------------------
## Comments Settings
## See: https://theme-next.org/docs/third-party-services/comments
## ---------------------------------------------------------------

## Multiple Comment System Support
comments:
  #use: Valine
  text: true
  # Available values: tabs | buttons
  style: tabs
  count: true
  # Choose a comment system to be displayed by default.
  # Available values: changyan | disqus | disqusjs | gitalk | livere | valine
  active: gitalk
  # Setting `true` means remembering the comment system selected by the visitor.
  storage: true
  # Lazyload all comment systems.
  lazyload: false
  # Modify texts or order for any navs, here are some examples.
  nav:
    gitalk:
      order: -1
    #disqus:
    #  text: Load Disqus
    #  order: -1
    #gitalk:
    #  order: -2
```

下面的也是配置，记得把用户名改一下

```yml
## Gitalk
## For more information: https://gitalk.github.io, https://github.com/gitalk/gitalk
gitalk:
  enable: true
  github_id: xingwangzhe
  repo: xingwangzhe.github.io
  client_id: sdaf # OAuth app的
  client_secret: asdfghjgds #同上
  admin_user: xingwangzhe
  distraction_free_mode: true # Facebook-like distraction free mode
  # Gitalk's display language depends on user's browser or system environment
  # If you want everyone visiting your site to see a uniform language, you can set a force language value
  # Available values: en | es-ES | fr | ru | zh-CN | zh-TW
  language: zh-CN
  proxy: "https://cors-anywhere.xingwangzhe.workers.dev/https://github.com/login/oauth/access_token"
  #worker，请记住这段链接，接下来要用到
```

---

### 利用cloudflare创建worker代理

![1scene](https://i.ibb.co/rf5jz8gR/1scene.png)
![2scene](https://i.ibb.co/VWxrB5XW/2scene.png)
![3scene](https://i.ibb.co/5gg8t76f/3scene.png)
![4scene](https://i.ibb.co/mf22cJL/4scene.png)
![5scene](https://i.ibb.co/gbVJhpcF/5scene.png)
别忘了注册的用户名是你的博客用户名
在左侧worker代码栏添加如下代码，但是请记得替换用户名。
代码栏有替换工具，这里就不演示了
[源码地址](https://github.com/chrisspiegl/cloudflare-cors-anywhere)

```js
const exclude = []; // Regexp for blacklisted urls
const include = [/^https?:\/\/.*xingwangzhe\.github\.io$/, /^https?:\/\/localhost/]; // Regexp for whitelisted origins e.g.
const apiKeys = {
  EZWTLwVEqFnaycMzdhBz: {
    name: "Test App",
    expired: false,
    exclude: [], // Regexp for blacklisted urls
    include: ["^http.?://xingwangzhe.github.io$", "xingwangzhe.github.io$", "^https?://localhost/"], // Regexp for whitelisted origins
  },
};

// Config is all above this line.
// It should not be necessary to change anything below.

function verifyCredentials(request) {
  // Throws exception on verification failure.
  const requestApiKey = request.headers.get("x-cors-proxy-api-key");
  if (!Object.keys(apiKeys).includes(requestApiKey)) {
    throw new UnauthorizedException("Invalid authorization key.");
  }

  if (apiKeys[requestApiKey].expired) {
    throw new UnauthorizedException("Expired authorization key.");
  }

  if (apiKeys[requestApiKey].expiresAt && apiKeys[requestApiKey].expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedException(
      `Expired authorization key.\nKey was valid until: ${apiKeys[requestApiKey].expiresAt}`,
    );
  }

  return apiKeys[requestApiKey];
}

function checkRequiredHeadersPresent(request) {
  // Throws exception on verification failure.
  if (!request.headers.get("Origin") && !request.headers.get("x-requested-with")) {
    throw new BadRequestException(
      "Missing required request header. Must specify one of: origin,x-requested-with",
    );
  }
}

function UnauthorizedException(reason) {
  this.status = 401;
  this.statusText = "Unauthorized";
  this.reason = reason;
}

function BadRequestException(reason) {
  this.status = 400;
  this.statusText = "Bad Request";
  this.reason = reason;
}

function isListed(uri, listing) {
  let returnValue = false;
  console.log(uri);
  if (typeof uri === "string") {
    for (const m of listing) {
      if (uri.match(m) !== null) {
        returnValue = true;
      }
    }
  } else {
    //   Decide what to do when Origin is null
    returnValue = true; // True accepts null origins false rejects them.
  }

  return returnValue;
}

function fix(myHeaders, request, isOPTIONS) {
  myHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin"));
  if (isOPTIONS) {
    myHeaders.set(
      "Access-Control-Allow-Methods",
      request.headers.get("access-control-request-method"),
    );
    const acrh = request.headers.get("access-control-request-headers");

    if (acrh) {
      myHeaders.set("Access-Control-Allow-Headers", acrh);
    }

    myHeaders.delete("X-Content-Type-Options");
  }

  return myHeaders;
}

function parseURL(requestUrl) {
  const match = requestUrl.match(
    /^(?:(https?:)?\/\/)?(([^/?]+?)(?::(\d{0,5})(?=[/?]|$))?)([/?][\S\s]*|$)/i,
  );
  //                              ^^^^^^^          ^^^^^^^^      ^^^^^^^                ^^^^^^^^^^^^
  //                            1:protocol       3:hostname     4:port                 5:path + query string
  //                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                            2:host

  if (!match) {
    console.log("no match");
    throw new BadRequestException("Invalid URL for proxy request.");
  }

  console.log("parseURL:match:", match);

  if (!match[1]) {
    console.log("nothing in match group 1");
    if (/^https?:/i.test(requestUrl)) {
      console.log(
        'The pattern at top could mistakenly parse "http:///" as host="http:" and path=///.',
      );
      throw new BadRequestException("Invalid URL for proxy request.");
    }

    // Scheme is omitted.
    if (requestUrl.lastIndexOf("//", 0) === -1) {
      console.log('"//" is omitted');
      requestUrl = "//" + requestUrl;
    }

    requestUrl = (match[4] === "443" ? "https:" : "http:") + requestUrl;
  }

  const parsed = new URL(requestUrl);
  if (!parsed.hostname) {
    console.log('"http://:1/" and "http:/notenoughslashes" could end up here.');
    throw new BadRequestException("Invalid URL for proxy request.");
  }

  return parsed;
}

async function proxyRequest(request, activeApiKey) {
  const isOPTIONS = request.method === "OPTIONS";
  const originUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  // ParseURL throws when the url is invalid
  const fetchUrl = parseURL(request.url.replace(originUrl.origin, "").slice(1));

  // Throws if it fails the check
  checkRequiredHeadersPresent(request);

  // Excluding urls which are not allowed as destination urls
  // Exclude origins which are not int he included ones
  if (
    isListed(fetchUrl.toString(), [...exclude, ...(activeApiKey?.exclude || [])]) ||
    !isListed(origin, [...include, ...(activeApiKey?.include || [])])
  ) {
    throw new BadRequestException("Origin or Destination URL is not allowed.");
  }

  let corsHeaders = request.headers.get("x-cors-headers");

  if (corsHeaders !== null) {
    try {
      corsHeaders = JSON.parse(corsHeaders);
    } catch {}
  }

  if (!originUrl.pathname.startsWith("/")) {
    throw new BadRequestException('Pathname does not start with "/"');
  }

  const recvHpaireaders = {};
  for (const pair of request.headers.entries()) {
    if (
      pair[0].match("^origin") === null &&
      pair[0].match("eferer") === null &&
      pair[0].match("^cf-") === null &&
      pair[0].match("^x-forw") === null &&
      pair[0].match("^x-cors-headers") === null
    ) {
      recvHpaireaders[pair[0]] = pair[1];
    }
  }

  if (corsHeaders !== null) {
    for (const c of Object.entries(corsHeaders)) {
      recvHpaireaders[c[0]] = c[1];
    }
  }

  const newRequest = new Request(request, {
    headers: recvHpaireaders,
  });

  const response = await fetch(fetchUrl, newRequest);
  let myHeaders = new Headers(response.headers);
  const newCorsHeaders = [];
  const allh = {};
  for (const pair of response.headers.entries()) {
    newCorsHeaders.push(pair[0]);
    allh[pair[0]] = pair[1];
  }

  newCorsHeaders.push("cors-received-headers");
  myHeaders = fix(myHeaders, request, isOPTIONS);

  myHeaders.set("Access-Control-Expose-Headers", newCorsHeaders.join(","));

  myHeaders.set("cors-received-headers", JSON.stringify(allh));

  const body = isOPTIONS ? null : await response.arrayBuffer();

  return new Response(body, {
    headers: myHeaders,
    status: isOPTIONS ? 200 : response.status,
    statusText: isOPTIONS ? "OK" : response.statusText,
  });
}

function homeRequest(request) {
  const isOPTIONS = request.method === "OPTIONS";
  const originUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  const remIp = request.headers.get("CF-Connecting-IP");
  const corsHeaders = request.headers.get("x-cors-headers");
  let myHeaders = new Headers();
  myHeaders = fix(myHeaders, request, isOPTIONS);

  let country = false;
  let colo = false;
  if (typeof request.cf !== "undefined") {
    country = typeof request.cf.country === "undefined" ? false : request.cf.country;
    colo = typeof request.cf.colo === "undefined" ? false : request.cf.colo;
  }

  return new Response(
    "CLOUDFLARE-CORS-ANYWHERE\n\n" +
      "Source:\nhttps://github.com/chrisspiegl/cloudflare-cors-anywhere\n\n" +
      "Usage:\n" +
      originUrl.origin +
      "/{uri}\n" +
      "Header x-cors-proxy-api-key must be set with valid api key\n" +
      "Header origin or x-requested-with must be set\n\n" +
      // + 'Limits: 100,000 requests/day\n'
      // + '          1,000 requests/10 minutes\n\n'
      (origin === null ? "" : "Origin: " + origin + "\n") +
      "Ip: " +
      remIp +
      "\n" +
      (country ? "Country: " + country + "\n" : "") +
      (colo ? "Datacenter: " + colo + "\n" : "") +
      "\n" +
      (corsHeaders === null ? "" : "\nx-cors-headers: " + JSON.stringify(corsHeaders)),
    { status: 200, headers: myHeaders },
  );
}

async function handleRequest(request) {
  const { protocol, pathname } = new URL(request.url);
  // In the case of a "Basic" authentication, the exchange MUST happen over an HTTPS (TLS) connection to be secure.
  if (protocol !== "https:" || request.headers.get("x-forwarded-proto") !== "https") {
    throw new BadRequestException("Must use a HTTPS connection.");
  }

  switch (pathname) {
    case "/favicon.ico":
    case "/robots.txt":
      return new Response(null, { status: 204 });
    case "/":
      return homeRequest(request);
    default: {
      // Not 100% sure if this is a good idea…
      // Right now all OPTIONS requests are just simply replied to because otherwise they fail.
      // This is necessary because apparently, OPTIONS requests do not carry the `x-cors-proxy-api-key` header so this can not be authorized.
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: fix(new Headers(), request, true),
          status: 200,
          statusText: "OK",
        });
      }

      // The "x-cors-proxy-api-key" header is sent when authenticated.
      //if (request.headers.has('x-cors-proxy-api-key')) {
      // Throws exception when authorization fails.
      //const activeApiKey = verifyCredentials(request);

      // Only returns this response when no exception is thrown.
      return proxyRequest(request);
      //}

      // Not authenticated.
      //throw new UnauthorizedException('Valid x-cors-proxy-api-key header has to be provided.');
    }
  }
}

addEventListener("fetch", async (event) => {
  event.respondWith(
    handleRequest(event.request).catch((error) => {
      const message = error.reason || error.stack || "Unknown Error";

      return new Response(message, {
        status: error.status || 500,
        statusText: error.statusText || null,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
          // Disables caching by default.
          "Cache-Control": "no-store",
          // Returns the "Content-Length" header for HTTP HEAD requests.
          "Content-Length": message.length,
        },
      });
    }),
  );
});
```

然后就大功告成了：）

## 无脑解决 2024/9/16

将 proxy 替换为了

> `proxy: https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token`

再次 hexo clean && hexo g -d, 即可使用 gitalk, 评论区会作为设置中的 repo 的 issue 存在.

## 后话

如果你为你的博客购买了其他的域名，记得要在OAuh Apps设置的返回链接改成你的域名
当然，连带着worker应该也要改，但是在这里我还是建议你直接使用无脑的那个`proxy`

> 我为此折腾了半天：（

[1]: https://github.com/
[2]: https://dash.cloudflare.com/
