import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import 'dotenv/config'; 

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CHANNELS = [
  { id: 'music', name: '音乐', query: '华语 独立音乐 新闻 OR 巡演 OR 新专辑' },
  { id: 'anime', name: '动漫', query: '新番动画 定档资讯 OR 动漫电影预告' },
  { id: 'novel', name: '小说', query: '网文资讯 OR 奇幻小说出版 OR 文学奖项' },
  { id: 'tech',  name: '科技', query: 'AI前沿技术 OR 消费电子新品发布' },
  { id: 'movie', name: '电影', query: '院线新片定档 OR 国际电影节获奖' },
  { id: 'travel',name: '旅行', query: '免签政策更新 OR 热门旅行目的地趋势' }
];

// --- 究极重试引擎：专门对付 503 高负载 ---
async function generateWithRetry(model, prompt, maxRetries = 5) { // 增加到 5 次重试
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const aiResult = await model.generateContent(prompt);
      return JSON.parse(aiResult.response.text());
    } catch (error) {
      const errorMsg = error.message || '';
      // 捕捉 503 拥挤 和 429 限流
      if (errorMsg.includes('503') || errorMsg.includes('429') || errorMsg.includes('fetch failed')) {
        console.warn(`    [拥挤] 服务器爆满 (503/429)，正在进行第 ${attempt} 次重试等待...`);
        if (attempt === maxRetries) throw new Error('达到最大重试次数，服务器持续无响应');
        
        // 指数退避：每次失败后等待的时间越来越长 (10秒, 20秒, 30秒...)
        const waitTime = attempt * 10000; 
        await new Promise(r => setTimeout(r, waitTime));
      } else {
        // 如果是 404 等其他代码错误，直接报错
        throw error;
      }
    }
  }
}

async function fetchChannelData(channel, genAI) {
  if (!SERPER_API_KEY) throw new Error('缺失 SERPER_API_KEY');

  const searchRes = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: channel.query, tbs: "qdr:d", num: 10, gl: "cn", hl: "zh-cn" })
  });

  if (!searchRes.ok) throw new Error(`Serper 异常: ${searchRes.statusText}`);
  const searchData = await searchRes.json();
  
  const rawContext = (searchData.organic || []).map((item, index) => 
    `[${index+1}] ${item.title}: ${item.snippet}`
  ).join('\n');

  if (!rawContext) return ["今日暂无有效热点"];

  // 确信调用 2.5 版本
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `你是一个冷峻的信息官。将以下【${channel.name}】原始数据压缩为 5 条简讯。
    规则：1. 仅限单句或简单陈述最多50个中文字。2. 绝无废话。3. 严格返回一个 JSON 数组。
    数据：\n${rawContext}`;

  return await generateWithRetry(model, prompt);
}

async function runNewsAgent() {
  console.log('>>> AI 见习编辑部 启动巡逻 (抗高并发模式)...');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const finalData = {};

  for (const channel of CHANNELS) {
    console.log(`[抓取] 正在处理: ${channel.name} ...`);
    try {
      finalData[channel.id] = await fetchChannelData(channel, genAI);
      console.log(`[成功] ${channel.name} 提炼完毕！`);
    } catch (error) {
      console.error(`[失败] ${channel.name} 彻底挂掉: ${error.message}`);
      finalData[channel.id] = [`服务器开小差了，暂无${channel.name}简讯`];
    }
    
    // 大幅增加冷却带：处理完一个频道，强制喝茶休息 15 秒！
    // 很多 503 都是因为短时间内请求过于密集触发的熔断。
    await new Promise(r => setTimeout(r, 15000));
  }

  finalData.lastUpdated = new Date().toISOString();
  fs.writeFileSync('./public/news_all.json', JSON.stringify(finalData, null, 2));
  console.log('>>> 全频道巡逻结束，news_all.json 已更新！');
}

runNewsAgent();