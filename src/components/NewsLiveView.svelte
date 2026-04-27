<script>
  import { onMount } from 'svelte';
  let { onBack, isOnline } = $props();

const allCategories = [
  { id: 'music', label: '音乐' },
  { id: 'novel', label: '小说' },
  { id: 'tech', label: '科技' },
  { id: 'movie', label: '电影' },
  { id: 'focus', label: '焦点' }
];

  // 同时确保 subscribedIds 的初始状态包含了这些新 ID
  let subscribedIds = $state(['music', 'anime', 'novel', 'tech', 'movie', 'travel']);
  let activeTab = $state('all'); // 当前选中的标签
  let searchQuery = $state(''); // 搜索框内容
  let showSettings = $state(false); // 是否显示订阅设置面板

  // 2. 原始快讯数据
  // const rawNews = [
  //   { time: '16:45', content: '央行今日开展 20 亿元 7 天期逆回购操作，中标利率 1.80%。', type: 'finance' },
  //   { time: '16:20', content: '科技巨头宣布其自研端侧大模型已适配主流移动端芯片，推理延迟降低 40%。', type: 'tech' },
  //   { time: '15:55', content: '全球最大音乐流媒体平台数据同步完成：本周独立音乐播放量环比上升 12%。', type: 'music' },
  //   { time: '15:10', content: '新一轮成品油调价窗口将于明日开启，机构预测或迎来“三连跌”。', type: 'energy' },
  //   { time: '14:30', content: '某知名音乐人宣布将于 2026 年启动全球告别巡演。', type: 'music' },
  //   { time: '12:00', content: '午间简评：三大股指震荡整理，半导体板块逆势走强。', type: 'finance' },
  //   { time: '09:15', content: '【预警】多地发布雷电黄色预警信号，注意防范短时强降雨。', type: 'alert' }
  // ];
  // 改为从空数组开始
  let rawNews = $state([]); 
  let isLoading = $state(true);
  let lastUpdated = $state(''); // 用来显示数据的最后更新时间

  // 核心拉取逻辑
  async function fetchRealNews() {
    try {
      isLoading = true;
      // 生产环境下，由于 json 放在 public 目录下，可以直接通过绝对路径请求
      // 添加时间戳防止浏览器缓存旧的 JSON
      const res = await fetch(`/news_all.json?t=${Date.now()}`);
      if (!res.ok) throw new Error('数据拉取失败');
      
      const aiData = await res.json();
      
      // 保存更新时间
      if (aiData.lastUpdated) {
        const date = new Date(aiData.lastUpdated);
        lastUpdated = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 将 AI 吐出的格式 {"music": ["新闻1"], "tech": ["新闻2"]} 
      // 转换为我们 UI 需要的扁平化数组格式：[{ time, content, type }]
      let formattedNews = [];
      
      for (const [category, newsArray] of Object.entries(aiData)) {
        if (category === 'lastUpdated') continue; 
        
        // 如果数据是数组，遍历转换
        if (Array.isArray(newsArray)) {
          newsArray.forEach(text => {
            formattedNews.push({
              time: lastUpdated || '最新', // 简易处理：用更新时间作为新闻时间
              content: text,
              type: category
            });
          });
        }
      }

      // 更新到状态中
      rawNews = formattedNews;
      
    } catch (error) {
      console.error('获取快讯失败:', error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchRealNews();
  });


  // 3. 核心过滤逻辑：计算最终显示的列表
  let filteredNews = $derived.by(() => {
    return rawNews.filter(item => {
      const matchTab = activeTab === 'all' || item.type === activeTab;
      const matchSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  });

  // 处理订阅切换
  function toggleSubscription(id) {
    if (subscribedIds.includes(id)) {
      subscribedIds = subscribedIds.filter(i => i !== id);
    } else {
      subscribedIds = [...subscribedIds, id];
    }
    // 如果取消订阅了当前选中的标签，自动切回'全部'
    if (!subscribedIds.includes(activeTab) && activeTab !== 'all') activeTab = 'all';
  }
</script>

<div class="news-live-page">
  <nav class="live-nav">
    <div class="nav-left">
      <button class="back-btn" onclick={onBack}>← 返回</button>
      <span class="page-title">7×24 快讯</span>
    </div>

    <div class="nav-right">
      {#if isLoading}
    <span style="font-size: 12px; color: #999;">同步中...</span>
  {:else if lastUpdated}
    <span style="font-size: 12px; color: #999;">更新于 {lastUpdated}</span>
  {/if}

      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          placeholder="搜索关键词..." 
          bind:value={searchQuery}
        />
      </div>
      <div class="status-indicator">
        <span class="dot" class:online={isOnline}></span>
      </div>
    </div>
    
  </nav>

  <div class="tab-bar">
    <div class="tabs-scroll">
      <button class="tab-item" class:active={activeTab === 'all'} onclick={() => activeTab = 'all'}>
        全部
      </button>
      {#each allCategories.filter(c => subscribedIds.includes(c.id)) as cat}
        <button 
          class="tab-item" 
          class:active={activeTab === cat.id} 
          onclick={() => activeTab = cat.id}
        >
          {cat.label}
        </button>
      {/each}
    </div>
    <button class="settings-trigger" onclick={() => showSettings = !showSettings}>
      {showSettings ? '✕' : '＋'}
    </button>
  </div>

  {#if showSettings}
    <div class="settings-panel">
      <div class="panel-title">定制我的频道</div>
      <div class="tag-group">
        {#each allCategories as cat}
          <button 
            class="tag-pill" 
            class:selected={subscribedIds.includes(cat.id)}
            onclick={() => toggleSubscription(cat.id)}
          >
            {cat.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="timeline-container">
    <div class="vertical-line"></div>
    
    {#if filteredNews.length === 0}
      <div class="empty-state">未找到相关快讯</div>
    {:else}
      {#each filteredNews as item}
        <div class="news-node">
          <div class="node-time">
            <span class="time-text">{item.time}</span>
            <span class="node-dot"></span>
          </div>
          <div class="node-content">
            <div class="type-tag">{allCategories.find(c => c.id === item.type)?.label}</div>
            <p>{item.content}</p>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .news-live-page {
    position: fixed;
    inset: 0;
    background: #ffffff;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  /* 导航栏优化 */
  .live-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #1a1a1a;
    color: white;
  }

  .nav-left { display: flex; align-items: center; gap: 12px; }
  .page-title { font-size: 15px; font-weight: 600; }
  
  .back-btn { background: none; border: none; color: #999; font-size: 14px; cursor: pointer; }

  .nav-right { display: flex; align-items: center; gap: 12px; }

  /* 搜索框设计 */
  .search-wrapper {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 4px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .search-wrapper input {
    background: transparent;
    border: none;
    color: white;
    font-size: 12px;
    width: 80px;
    outline: none;
  }

  .search-icon { font-size: 12px; opacity: 0.6; }

  /* 标签栏设计 */
  .tab-bar {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    padding: 0 12px;
    background: #fff;
  }

  .tabs-scroll {
    flex: 1;
    display: flex;
    overflow-x: auto;
    gap: 20px;
    padding: 12px 0;
    scrollbar-width: none;
  }
  .tabs-scroll::-webkit-scrollbar { display: none; }

  .tab-item {
    white-space: nowrap;
    background: none;
    border: none;
    font-size: 14px;
    color: #999;
    padding: 0 4px;
    cursor: pointer;
    position: relative;
  }

  .tab-item.active {
    color: #333;
    font-weight: 600;
  }

  .tab-item.active::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 0;
    right: 0;
    height: 2px;
    background: #333;
  }

  .settings-trigger {
    background: none;
    border: none;
    font-size: 18px;
    color: #ccc;
    padding: 0 8px;
    cursor: pointer;
  }

  /* 订阅设置面板 */
  .settings-panel {
    background: #f9f9fb;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    animation: fadeIn 0.2s;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } }

  .panel-title { font-size: 12px; color: #999; margin-bottom: 12px; }

  .tag-group { display: flex; flex-wrap: wrap; gap: 8px; }

  .tag-pill {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #eee;
    background: #fff;
    font-size: 12px;
    color: #666;
    cursor: pointer;
  }

  .tag-pill.selected {
    background: #333;
    color: #fff;
    border-color: #333;
  }

  /* 时间轴与内容 */
  .timeline-container { flex: 1; overflow-y: auto; padding: 24px 16px; position: relative; }
  .vertical-line { position: absolute; left: 64px; top: 0; bottom: 0; width: 1px; background: #f0f0f0; }

  .news-node { display: flex; gap: 20px; margin-bottom: 24px; position: relative; z-index: 2; }
  .node-time { width: 48px; display: flex; align-items: center; justify-content: space-between; }
  .time-text { font-size: 12px; color: #999; font-family: 'SF Mono', monospace; }
  .node-dot { width: 8px; height: 8px; background: #fff; border: 2px solid #333; border-radius: 50%; margin-right: -4px; }

  .node-content {
    flex: 1;
    background: #f9f9fb;
    padding: 14px;
    border-radius: 12px;
    position: relative;
  }

  .type-tag {
    position: absolute;
    top: 10px;
    right: 12px;
    font-size: 10px;
    color: #bbb;
    text-transform: uppercase;
  }

  .node-content p { 
  font-size: 14px; 
  color: #333; 
  line-height: 1.6; 
  margin: 0; 
  text-align: left; /* 强制左对齐，阻断外部继承 */
  word-break: break-all; /* 防止长英文或链接破坏排版 */
  }

  .empty-state { text-align: center; padding: 40px; color: #ccc; font-size: 14px; }

  .status-indicator .dot.online { background: #34c759; box-shadow: 0 0 8px #34c759; }
</style>