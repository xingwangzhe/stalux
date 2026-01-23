// 已弃用的运行时按年查询端点。
// 请改用构建期生成的静态归档 JSON：`/api/archives.static.json`。
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({
        error: '',
    }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
    });
};
