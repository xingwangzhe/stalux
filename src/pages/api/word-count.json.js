import { getTotalWordCount, formatWordCount } from '../../utils/word-count-utils';

export async function GET() {
  try {
    const totalWords = await getTotalWordCount();
    const formattedCount = formatWordCount(totalWords);

    return new Response(JSON.stringify({
      totalWords,
      formattedCount,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // 缓存1小时
      }
    });
  } catch (error) {
    console.error('获取字数统计失败:', error);
    return new Response(JSON.stringify({
      totalWords: 0,
      formattedCount: '0',
      success: false,
      error: '获取字数统计失败'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
