// EdgeOne's hosted builder can classify this static site as a SPA.
await Bun.write(
    ".edgeone/routes.json",
    JSON.stringify({
        version: 3,
        conf: { rewrites: (await Bun.file("edgeone.json").json()).rewrites },
        routes: [
            { handle: "filesystem" },
            { src: "/.*", dest: "/404.html", "server-name": "file", status: 404 },
        ],
    }),
);

export {};
