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

// 幸运颜色（更丰富细致）
const LUCKY_COLORS_RICH = [
  '樱桃红', '天空蓝', '翡翠绿', '金橙色', '薰衣草紫',
  '珊瑚粉', '宝石蓝', '柠檬黄', '玫瑰金', '薄荷绿',
  '酒红色', '孔雀蓝', '杏色', '丁香紫', '湖蓝色'
];

// 贵人星座池
const NOBLE_SIGNS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];

// 各星座的爱情运势描述池（每个星座多条，按运势高低分5档）
const LOVE_DESC = {
  low: [
    '单身者恋爱运较弱，常把微笑挂在脸上可提升异性缘；恋爱中的人易被恋人误会。',
    '感情方面容易有摩擦，多站在对方角度思考，切忌固执己见。',
    '桃花运有些低迷，但不必着急，缘分来了自然挡不住。',
    '感情上会遇到一些小困扰，冷静处理比冲动更明智。',
    '单身者容易陷入暗恋，有情况不如主动出击；有伴侣者要多陪伴。'
  ],
  mid: [
    '感情运势平稳，有伴侣的人适合安排一次小约会增进感情。',
    '单身者今天有机会和有好感的人深入交流，把握机会。',
    '感情方面没有大波折，但也要用心经营，不能懈怠。',
    '恋爱中的人可能会有些小争吵，以退为进往往效果更好。',
    '桃花运一般，但身边或许就有意想不到的缘分在等着你。'
  ],
  high: [
    '爱情运势旺盛，单身者有望邂逅心仪对象，有伴侣的人感情更加甜蜜。',
    '桃花朵朵开！今天特别容易给人留下好印象，大方展示自己的魅力吧。',
    '感情方面顺风顺水，恋人之间心有灵犀，相处格外融洽。',
    '今天适合向心仪的人表白，成功率颇高；有伴侣的人感情稳定甜蜜。',
    '爱情运极佳，可能有意外的惊喜等着你，要保持开放的心态。'
  ]
};

// 财富运势描述池
const WEALTH_DESC = {
  low: [
    '大笔投资时，要好好做功课，没时间做功课就别投资咯！',
    '财运稍弱，今天不宜大额消费或冒险投资，守住钱包最重要。',
    '钱财方面要谨慎，可能有意外开销，提前做好心理准备。',
    '财运欠佳，避免跟风投资，稳健理财才是正道。',
    '这两天花钱要有节制，能省则省，细水长流。'
  ],
  mid: [
    '财运平平，适合做些稳健的理财规划，不宜冒险。',
    '收入和支出基本平衡，量入为出，理性消费。',
    '财运一般，偏财运不旺，正财还好，踏实工作是关键。',
    '金钱方面没有大起大落，维持现有节奏即可。',
    '适合梳理一下财务状况，做好未来的储蓄计划。'
  ],
  high: [
    '财运不错，可能有意外之财或好的投资机会，但也要量力而行。',
    '偏财运旺！今天运气不错，可以适当参与一些低风险理财。',
    '财运亨通，工作上可能有额外收益，好好把握。',
    '金钱方面有好消息，可能是涨薪、奖金或意外收入。',
    '财运极佳，投资眼光准，这段时间可以稳步推进理财计划。'
  ]
};

// 事业运势描述池
const CAREER_DESC = {
  low: [
    '上司对你多加挑剔，会让你觉得很烦，争辩会被认为是一种无理取闹，少说多做才好。',
    '工作上遇到阻碍，不要慌张，保持耐心，慢慢化解。',
    '今天工作效率不高，容易分心，重要事情不妨明天再做。',
    '职场上有些压力，可能来自同事或领导，学会放松很重要。',
    '事业运势偏弱，低调行事为上策，不要锋芒太露。'
  ],
  mid: [
    '工作运势中规中矩，按照既定计划推进，不要自乱阵脚。',
    '职场上没有特别的好事或坏事，脚踏实地做好本职工作。',
    '事业运平稳，适合处理日常事务，不宜做重大决策。',
    '工作方面虽然没有太大突破，但基础工作做扎实也很重要。',
    '今天适合整理工作思路，为下一步发展做好铺垫。'
  ],
  high: [
    '事业运势旺盛，工作上思路清晰，表现出色，容易获得认可。',
    '今天职场上有贵人相助，好好把握合作机会。',
    '工作顺风顺水，有望完成重要项目或获得好评。',
    '事业上有突破的可能，勇敢展示自己的能力，机会就在眼前。',
    '职场运极佳，今天是谈合作、汇报项目的好时机。'
  ]
};

// 整体运势描述池
const OVERALL_DESC = {
  low: [
    '对方模棱两可的态度让你感到苦恼，感觉遇到爱情的叉道口，有些不知所措。理财小有收获，有节约习惯的人更是收效明显。学生课业压力较大，遇到的困难也极具挑战性，需请教他人才能有所突破。',
    '今天运势整体偏低，很多事情不顺心，需要多一些耐心。要注意保持情绪稳定，冲动是魔鬼。',
    '运势低迷的一天，建议低调行事，少做决定，等待时机好转再出手。',
    '今天诸事不顺，但也不要灰心，逆境往往是成长的契机。多休息，调整状态。',
    '整体运势欠佳，感情、工作都需要格外用心，不要轻易放弃。'
  ],
  mid: [
    '今天运势平稳，没有大起大落。工作上按部就班，生活中保持平和心态，就是最好的状态。',
    '运势中庸，但平淡也是一种幸福。感情稳定，工作稳中求进，财运一般但无大碍。',
    '今天属于普通的一天，但平凡中有小确幸，用心感受身边的美好。',
    '整体运势一般，专注于当下最重要的事，不要分散精力在无关的事上。',
    '运势平平，但做好该做的事，也是一种积累。机会留给有准备的人。'
  ],
  high: [
    '今天整体运势极佳！感情、事业、财运全面开花，是大展身手的好日子，记得抓住机会。',
    '好运连连的一天！无论做什么都顺顺利利，心情愉快，充分利用这股好运吧。',
    '运势旺盛，今天适合推进重要计划，与人交流效果也很好，贵人随时出现。',
    '今天精力充沛、思路敏捷，是突破自我的好时机，勇敢迈出那一步！',
    '整体运势非常不错，保持积极心态，相信自己，一切皆有可能。'
  ]
};

// 提示语池
const TIPS_POOL = [
  '借歌抒情是排解忧愁的好办法。',
  '深呼吸，放慢脚步，今天就从容一点吧。',
  '和久未联系的朋友叙叙旧，能带来意想不到的好运。',
  '整理一下房间，空间清爽了，心情也会跟着好转。',
  '多喝水，今天记得注意身体。',
  '遇到困难先不要急，睡一觉往往会有新的思路。',
  '一个微笑，能化解很多尴尬和误会。',
  '今天适合早睡，养精蓄锐，明天更好出发。',
  '把今天想说的话说出来，憋着只会让自己更累。',
  '运动一下，哪怕散散步，心情都会好很多。',
  '用心对待今天遇到的每一个人，善意会回来的。',
  '找一首喜欢的歌单循环播放，进入今天的最佳状态。'
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
  const luckyNumbers = [1, 2, 3, 5, 6, 7, 8, 9];
  const directions = ['东方', '西方', '南方', '北方', '东南方', '西南方', '东北方', '西北方'];
  
  const luckyColor = LUCKY_COLORS_RICH[Math.floor(random() * LUCKY_COLORS_RICH.length)];
  const luckyNumber = luckyNumbers[Math.floor(random() * luckyNumbers.length)];
  const luckyDirection = directions[Math.floor(random() * directions.length)];
  
  // 贵人星座（排除自身）
  const otherSigns = NOBLE_SIGNS.filter(s => s !== constellation.name);
  const nobleSign = otherSigns[Math.floor(random() * otherSigns.length)];
  
  // 提示语
  const tip = TIPS_POOL[Math.floor(random() * TIPS_POOL.length)];
  
  // 根据分数选择描述文本
  function pickDesc(pool, score) {
    if (score <= 2) return pool.low[Math.floor(random() * pool.low.length)];
    if (score <= 3) return pool.mid[Math.floor(random() * pool.mid.length)];
    return pool.high[Math.floor(random() * pool.high.length)];
  }
  
  const loveDesc = pickDesc(LOVE_DESC, love);
  const wealthDesc = pickDesc(WEALTH_DESC, wealth);
  const careerDesc = pickDesc(CAREER_DESC, career);
  const overallDesc = pickDesc(OVERALL_DESC, overall);
  
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
    nobleSign,
    loveDesc,
    wealthDesc,
    careerDesc,
    overallDesc,
    tip,
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

// 格式化微信输出（仿旧版格式，内容丰富接地气）
function formatWechatOutput(result) {
  return `星座：${result.constellation}\n` +
    `贵人方位：${result.luckyDirection}\n` +
    `贵人星座：${result.nobleSign}\n` +
    `幸运数字：${result.luckyNumber}\n` +
    `幸运颜色：${result.luckyColor}\n` +
    `爱情运势：${result.loveDesc}\n` +
    `财富运势：${result.wealthDesc}\n` +
    `事业运势：${result.careerDesc}\n` +
    `整体运势：${result.overallDesc}\n` +
    `提示：${result.tip}`;
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
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isWeChat = userAgent.includes('micromessenger') || userAgent.includes('wechat');
    const wantsJson = query.format === 'json';
    const wantsText = query.format === 'text';
    
    // 调试信息（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`User-Agent: ${req.headers['user-agent']?.substring(0, 100)}...`);
      console.log(`isWeChat: ${isWeChat}, wantsJson: ${wantsJson}, wantsText: ${wantsText}`);
    }
    
    // 如果是微信环境且未明确要求JSON，则返回文本格式
    if ((isWeChat && !wantsJson) || wantsText) {
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
