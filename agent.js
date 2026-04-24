import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// 配置你的密钥 (实际部署时建议放入环境变量 .env)
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function runNewsAgent() {
  console.log('[系统] 启动信息嗅探...');

  // ---------------------------------------------------------
  // 阶段 1: Serper 搜索抓取 (获取原始素材)
  // ---------------------------------------------------------
  const searchPayload = JSON.stringify({
    q: "华语 独立音乐 新闻 OR 巡演 OR 新专辑",
    tbs: "qdr:d", // 强制时间限制：过去 24 小时 (d=day)
    num: 10,      // 抓取前 10 条
    gl: "cn",     // 地区
    hl: "zh-cn"   // 语言
  });

  const searchRes = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json'
    },
    body: searchPayload
  });

  const searchData = await searchRes.json();
  
  // 提取标题和摘要，拼装成浓缩文本，减少给 LLM 的 Token 消耗
  const rawContext = searchData.organic.map((item, index) => 
    `[${index+1}] 标题:${item.title} | 摘要:${item.snippet}`
  ).join('\n');

  console.log('[系统] 原始数据抓取完成，移交 Gemini 处理...');

  // ---------------------------------------------------------
  // 阶段 2: Gemini 降噪与提炼 (执行 AI 逻辑)
  // ---------------------------------------------------------
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // 使用 Flash 模型，速度极快，适合处理文本过滤
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    // 核心参数：强制 Gemini 只吐出标准 JSON，绝不包含 Markdown 代码块或废话
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    你是一个硬核的独立音乐资讯编辑。
    阅读以下搜索引擎刚刚抓取的粗略新闻数据：
    
    ${rawContext}

    任务：
    1. 剔除重复、无关或价值低的信息。
    2. 提取出最具价值的 5 件事。
    3. 将每件事浓缩成单句标题（不超过 20 个字），拒绝修饰性废话。
    4. 返回格式必须是严格的 JSON 对象，格式如下：
    {
      "music": [
        "事件1标题",
        "事件2标题",
        ...
      ]
    }
  `;

  const aiResult = await model.generateContent(prompt);
  const finalJsonString = aiResult.response.text();

  // ---------------------------------------------------------
  // 阶段 3: 落盘与分发 (生成 PWA 可用的数据源)
  // ---------------------------------------------------------
  // 解析确认格式无误后写入静态文件
  const parsedData = JSON.parse(finalJsonString);
  
  // 增加一个更新时间戳，方便 PWA 前端显示“最后更新时间”
  parsedData.lastUpdated = new Date().toISOString();

  fs.writeFileSync('./public/news_music.json', JSON.stringify(parsedData, null, 2));
  
  console.log('[系统] 提炼完成！静态 JSON 文件已覆写。');
  console.log(parsedData);
}

// 触发执行
runNewsAgent().catch(console.error);