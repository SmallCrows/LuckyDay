<script>
  let { onBack, isOnline } = $props();
  
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;

  // 模拟 7x24 实时数据流
  const liveNews = [
    { time: '16:45', content: '央行今日开展 20 亿元 7 天期逆回购操作，中标利率 1.80%。', type: 'finance' },
    { time: '16:20', content: '科技巨头宣布其自研端侧大模型已适配主流移动端芯片，推理延迟降低 40%。', type: 'tech' },
    { time: '15:55', content: '全球最大音乐流媒体平台数据同步完成：本周独立音乐播放量环比上升 12%。', type: 'music' },
    { time: '15:10', content: '新一轮成品油调价窗口将于明日开启，机构预测或迎来“三连跌”。', type: 'energy' },
    { time: '14:30', content: '某知名音乐人宣布将于 2026 年启动全球告别巡演。', type: 'music' },
    { time: '12:00', content: '午间简评：三大股指震荡整理，半导体板块逆势走强。', type: 'finance' },
    { time: '09:15', content: '【预警】多地发布雷电黄色预警信号，注意防范短时强降雨。', type: 'alert' }
  ];
</script>

<div class="news-live-page">
  <nav class="live-nav">
    <button class="back-btn" onclick={onBack}>
      <span class="arrow">←</span> 返回 LuckDay
    </button>
    <div class="current-date">{dateStr}</div>
    <div class="status-indicator">
      <span class="dot" class:online={isOnline}></span>
      {isOnline ? '在线' : '离线'}
    </div>
  </nav>

  <div class="timeline-container">
    <div class="vertical-line"></div>
    
    {#each liveNews as item}
      <div class="news-node">
        <div class="node-time">
          <span class="time-text">{item.time}</span>
          <span class="node-dot"></span>
        </div>
        <div class="node-content">
          <p>{item.content}</p>
        </div>
      </div>
    {/each}
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
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  /* 导航栏样式 */
  .live-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #1a1a1a;
    color: white;
  }

  .back-btn {
    background: none;
    border: none;
    color: #999;
    font-size: 14px;
    cursor: pointer;
  }

  .back-btn:active { color: white; }

  .current-date { font-weight: 600; font-size: 15px; }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #999;
  }

  .dot { width: 6px; height: 6px; border-radius: 50%; background: #666; }
  .dot.online { background: #34c759; box-shadow: 0 0 8px #34c759; }

  /* 时间轴样式 */
  .timeline-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px 16px;
    position: relative;
  }

  .vertical-line {
    position: absolute;
    left: 64px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #f0f0f0;
    z-index: 1;
  }

  .news-node {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    position: relative;
    z-index: 2;
  }

  .node-time {
    width: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .time-text {
    font-size: 12px;
    color: #999;
    font-family: 'SF Mono', monospace;
  }

  .node-dot {
    width: 8px;
    height: 8px;
    background: #fff;
    border: 2px solid #333;
    border-radius: 50%;
    margin-right: -4px;
  }

  .node-content {
    flex: 1;
    background: #f9f9fb;
    padding: 14px;
    border-radius: 12px;
    font-size: 14px;
    color: #333;
    line-height: 1.6;
  }

  .news-node:first-child .node-dot {
    background: #333;
    box-shadow: 0 0 0 4px rgba(51, 51, 51, 0.1);
  }
</style>