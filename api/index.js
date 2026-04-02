// 星座运势API - 优化版（解决Vercel限流问题）
// 基于 https://github.com/jiangkun703/horoscope-api-wechat 优化

const CONSTELLATIONS = [
  { id: 'aries', name: '白羊座', en: 'Aries', date: '3.21-4.19', element: '火象', ruling: '火星' },
  { id: 'taurus', name: '金牛座', en: 'Taurus', date: '4.20-5.20', element: '土象', ruling: '金星' },
  { id: 'gemini', name: '双子座', en: 'Gemini', date: '5.21-6.21', element: '风象', ruling: '水星' },
  { id: 'cancer', name: '巨蟹座', en: 'Cancer', date: '6.22-7.22', element: '水象', ruling: '月亮' },
  { id: 'leo', name: '狮子座', en: 'Leo', date: '7.23-8.22', element: '火象', ruling: '太阳' },
  { id: 'virgo', name: '处女座', en: 'Virgo', date: '8.23-9.22', element: '土象', ruling: '水星' },
  { id: 'libra', name: '天秤座', en: 'Libra', date: '9.23-10.23', element: '风象', ruling: '金星' },
  { id: 'scorpio', name: '天蝎座', en: 'Scorpio', date: '10.24-11.22', element: '水象', ruling: '冥王星' },
  { id: 'sagittarius', name: '射手座', en: 'Sagittarius', date: '11.23-12.21', element: '火象', ruling: '木星' },
  { id: 'capricorn', name: '摩羯座', en: 'Capricorn', date: '12.22-1.19', element: '土象', ruling: '土星' },
  { id: 'aquarius', name: '水瓶座', en: 'Aquarius', date: '1.20-2.18', element: '风象', ruling: '天王星' },
  { id: 'pisces', name: '双鱼座', en: 'Pisces', date: '2.19-3.20', element: '水象', ruling: '海王星' }
];

// 缓存机制 - 解决Vercel限流问题的核心
const memoryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1小时缓存

// 运势评分词汇
const RATING_WORDS = [
  { level: 1, words: ['不佳', '欠佳', '需要注意'] },
  { level: 2, words: ['一般', '平平', '尚可'] },
  { level: 3, words: ['良好', '不错', '顺利'] },
  { level: 4, words: ['不错', '好运', '顺利'] },
  { level: 5, words: ['极佳', '大吉', '非常顺利'] }
];

const ADVICE_POOL = [
  "保持积极心态，机会就在眼前",
  "注意沟通方式，避免误会",
  "理财需谨慎，不要盲目投资",
  "健康是基础，注意休息",
  "团队合作能带来更好的效果",
  "今天适合学习新技能",
  "勇敢表达自己的想法",
  "细节决定成败，多检查",
  "信任他人，也值得被信任",
  "保持平衡，不要过度工作"
];

// 获取北京时间（UTC+8）
function getBeijingTime() {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

// 伪随机数生成器（基于日期和星座ID）
function seededRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// 生成星座运势（使用缓存机制）
function generateHoroscope(constellationId) {
  const today = getBeijingTime();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const cacheKey = `${constellationId}_${dateKey}`;
  
  // 检查内存缓存
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }
  
  // 生成种子
  const seed = parseInt(dateKey.replace(/-/g, '')) + CONSTELLATIONS.findIndex(c => c.id === constellationId);
  const random = seededRandom(seed);
  
  // 生成各项运势评分（1-5星）
  const overall = Math.floor(random() * 5) + 1;
  const love = Math.floor(random() * 5) + 1;
  const career = Math.floor(random() * 5) + 1;
  const wealth = Math.floor(random() * 5) + 1;
  const health = Math.floor(random() * 5) + 1;
  
  // 获取星座信息
  const constellation = CONSTELLATIONS.find(c => c.id === constellationId);
  
  // 生成幸运元素
  const luckyColors = ['红色', '蓝色', '绿色', '黄色', '紫色', '白色', '黑色'];
  const luckyNumbers = [1, 3, 5, 7, 8, 9, 11, 13];
  const directions = ['东方', '西方', '南方', '北方', '东南', '西南', '东北', '西北'];
  
  const luckyColor = luckyColors[Math.floor(random() * luckyColors.length)];
  const luckyNumber = luckyNumbers[Math.floor(random() * luckyNumbers.length)];
  const luckyDirection = directions[Math.floor(random() * directions.length)];
  
  // 生成今日建议
  const adviceIndex = Math.floor(random() * ADVICE_POOL.length);
  const dailyAdvice = ADVICE_POOL[adviceIndex];
  
  // 生成运势描述
  const ratingWord = RATING_WORDS.find(r => r.level === overall)?.words[0] || '不错';
  const description = `今日${constellation.name}运势${ratingWord}，${dailyAdvice}`;
  
  const result = {
    constellation: constellation.name,
    enName: constellation.en,
    date: constellation.date,
    element: constellation.element,
    ruling: constellation.ruling,
    today: dateKey,
    overall,
    love,
    career,
    wealth,
    health,
    luckyColor,
    luckyNumber,
    luckyDirection,
    dailyAdvice,
    description,
    timestamp: Date.now()
  };
  
  // 存入内存缓存（1小时）
  memoryCache.set(cacheKey, result);
  setTimeout(() => memoryCache.delete(cacheKey), CACHE_TTL);
  
  return result;
}

// 查找星座（支持多种输入格式）
function findConstellation(input) {
  const lowerInput = input.toLowerCase().trim();
  
  // 支持中文、英文、缩写
  for (const c of CONSTELLATIONS) {
    if (c.name === input) return c;
    if (c.en.toLowerCase() === lowerInput) return c;
    if (c.id.toLowerCase() === lowerInput) return c;
  }
  
  // 支持常见别名
  const aliasMap = {
    '白羊': 'aries', '金牛': 'taurus', '双子': 'gemini', '巨蟹': 'cancer',
    '狮子': 'leo', '处女': 'virgo', '天秤': 'libra', '天蝎': 'scorpio',
    '射手': 'sagittarius', '摩羯': 'capricorn', '水瓶': 'aquarius', '双鱼': 'pisces',
    '牡羊': 'aries', '山羊': 'capricorn'
  };
  
  if (aliasMap[lowerInput]) {
    return CONSTELLATIONS.find(c => c.id === aliasMap[lowerInput]);
  }
  
  return null;
}

// 格式化微信输出
function formatWechatOutput(result) {
  const stars = '★'.repeat(result.overall) + '☆'.repeat(5 - result.overall);
  
  return `✨ ${result.constellation}今日运势\n\n` +
    `综合：${stars}（${result.overall}星）\n` +
    `爱情：${'★'.repeat(result.love)}${'☆'.repeat(5 - result.love)}\n` +
    `事业：${'★'.repeat(result.career)}${'☆'.repeat(5 - result.career)}\n` +
    `财运：${'★'.repeat(result.wealth)}${'☆'.repeat(5 - result.wealth)}\n` +
    `健康：${'★'.repeat(result.health)}${'☆'.repeat(5 - result.health)}\n\n` +
    `📅 日期：${result.today}\n` +
    `💡 建议：${result.dailyAdvice}\n` +
    `🎨 幸运色：${result.luckyColor}\n` +
    `🔢 幸运数字：${result.luckyNumber}\n` +
    `🧭 幸运方位：${result.luckyDirection}\n\n` +
    `"${result.description}"`;
}

// 主处理函数
module.exports = async (req, res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时缓存
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 健康检查端点
  if (req.url === '/health' || req.url === '/api/health') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      memoryCacheSize: memoryCache.size,
      uptime: process.uptime()
    });
    return;
  }
  
  // 获取所有星座列表
  if (req.url === '/api/signs' || req.url === '/signs') {
    res.status(200).json({
      signs: CONSTELLATIONS.map(c => ({
        id: c.id,
        name: c.name,
        en: c.en,
        date: c.date,
        element: c.element
      })),
      count: CONSTELLATIONS.length,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // 批量查询所有星座
  if (req.url === '/api/all' || (req.query && req.query.all === 'true')) {
    try {
      const allResults = CONSTELLATIONS.map(c => generateHoroscope(c.id));
      res.status(200).json({
        data: allResults,
        count: allResults.length,
        today: getBeijingTime().toISOString().split('T')[0],
        timestamp: Date.now()
      });
      return;
    } catch (error) {
      res.status(500).json({
        error: '批量查询失败',
        message: error.message,
        availableSigns: CONSTELLATIONS.map(c => c.name)
      });
      return;
    }
  }
  
  // 解析查询参数
  const query = req.query || {};
  let constellationInput = query.sign || query.msg || query.constellation || query.c || '白羊座';
  
  // 处理根路径（显示文档）
  if (!constellationInput || req.url === '/' || req.url === '/api') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>星座运势API - 优化版</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .endpoint { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; }
    code { background: #e8e8e8; padding: 2px 5px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>♈ 星座运势API - 优化版</h1>
  <p>专为解决Vercel限流问题设计的优化版本</p>
  
  <h2>🔧 核心优化</h2>
  <ul>
    <li>✅ 1小时强缓存机制（解决限流）</li>
    <li>✅ 内存缓存（同一天结果一致）</li>
    <li>✅ 错误恢复保障</li>
    <li>✅ 支持高频调用</li>
  </ul>
  
  <h2>🚀 API端点</h2>
  
  <div class="endpoint">
    <h3>查询单个星座</h3>
    <p><code>GET /api?sign=星座名</code></p>
    <p>示例：<a href="/api?sign=天蝎座" target="_blank">/api?sign=天蝎座</a></p>
  </div>
  
  <div class="endpoint">
    <h3>批量查询所有星座</h3>
    <p><code>GET /api/all</code> 或 <code>GET /api?all=true</code></p>
    <p>示例：<a href="/api/all" target="_blank">/api/all</a></p>
  </div>
  
  <div class="endpoint">
    <h3>获取星座列表</h3>
    <p><code>GET /api/signs</code></p>
    <p>示例：<a href="/api/signs" target="_blank">/api/signs</a></p>
  </div>
  
  <div class="endpoint">
    <h3>健康检查</h3>
    <p><code>GET /health</code></p>
    <p>示例：<a href="/health" target="_blank">/health</a></p>
  </div>
  
  <h2>🎯 参数格式</h2>
  <ul>
    <li><code>sign</code>：星座中文名（如"天蝎座"）</li>
    <li><code>msg</code>：兼容微信消息格式</li>
    <li><code>constellation</code>：星座英文名（如"scorpio"）</li>
    <li><code>c</code>：星座ID（如"scorpio"）</li>
  </ul>
  
  <h2>📊 响应格式</h2>
  <pre><code>{
  "constellation": "天蝎座",
  "overall": 4,
  "love": 3,
  "career": 5,
  "wealth": 2,
  "health": 4,
  "luckyColor": "红色",
  "luckyNumber": 7,
  "luckyDirection": "东南方",
  "dailyAdvice": "保持积极心态",
  "description": "今日天蝎座运势不错，保持积极心态",
  "timestamp": 1234567890
}</code></pre>
  
  <footer>
    <p>部署时间：${new Date().toLocaleString()}</p>
    <p>缓存状态：内存缓存 ${memoryCache.size} 个项目</p>
  </footer>
</body>
</html>
    `);
    return;
  }
  
  try {
    // 查找星座
    const constellation = findConstellation(constellationInput);
    
    if (!constellation) {
      res.status(400).json({
        error: '星座不存在',
        input: constellationInput,
        availableSigns: CONSTELLATIONS.map(c => c.name),
        tips: '请使用中文全名，如"天蝎座"、"白羊座"等'
      });
      return;
    }
    
    // 生成运势（使用缓存）
    const horoscope = generateHoroscope(constellation.id);
    
    // 根据请求头决定输出格式
    const userAgent = req.headers['user-agent'] || '';
    
    // 如果是微信环境，返回文本格式
    if (userAgent.includes('MicroMessenger') || query.format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send(formatWechatOutput(horoscope));
      return;
    }
    
    // 默认返回JSON格式
    res.status(200).json(horoscope);
    
  } catch (error) {
    console.error('API Error:', error);
    
    // 错误恢复：返回静态后备数据
    const fallbackData = {
      constellation: constellationInput,
      overall: 3,
      love: 3,
      career: 3,
      wealth: 3,
      health: 3,
      luckyColor: '蓝色',
      luckyNumber: 5,
      luckyDirection: '东方',
      dailyAdvice: '今天一切都会顺利的',
      description: '运势平稳，保持平常心',
      timestamp: Date.now(),
      note: '此数据为错误恢复时的后备数据'
    };
    
    res.status(500).json(fallbackData);
  }
};
