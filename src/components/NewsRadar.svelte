<script>
  import { onMount } from 'svelte';

  // 定义用户可选的频道
  const channels = ['早报', '音乐', '科技'];
  let activeChannel = $state('早报');
  let newsList = $state([]);
  let isLoading = $state(false);

  // 模拟从服务器获取“一句话简讯”
  async function fetchNews(channel) {
    isLoading = true;
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 400));

    // 这里的真实场景是：发起 fetch 请求到你的聚合 API
    // const res = await fetch(`https://api.your-domain.com/hot?type=${channel}`);
    // const data = await res.json();
    
    // 以下为高质量的模拟数据，展示“一句话”风格
    const mockDb = {
      '早报': [
        "央行宣布下调存款准备金率0.5个百分点",
        "国内首个开源AI视频生成模型正式发布",
        "多地出台新规：全面放宽新能源汽车限购",
        "今年五一假期国内机票预订量同比增长30%",
        "某头部新势力车企宣布全系降价2万元"
      ],
      '音乐': [
        "Taylor Swift 新专辑空降 Billboard 榜首",
        "坂本龙一最后一场钢琴独奏音乐会纪录片定档",
        "周杰伦宣布开启 2026 全球巡回演唱会",
        "网易云音乐发布独立音乐人扶持计划 3.0",
        "复古 City Pop 歌单昨日全网播放量激增"
      ],
      '科技': [
        "苹果 WWDC 宣布全面接入端侧大模型",
        "SpaceX 星舰完成第五次试飞，成功回收助推器",
        "英伟达发布下一代桌面级显卡，算力翻倍",
        "Rust 语言正式成为 Linux 内核第二官方语言",
        "索尼 PS6 规格曝光：支持原生 8K 游戏"
      ]
    };

    newsList = mockDb[channel] || [];
    isLoading = false;
  }

  // 切换频道
  function switchChannel(channel) {
    if (activeChannel === channel) return;
    activeChannel = channel;
    fetchNews(channel);
  }

  onMount(() => {
    fetchNews(activeChannel);
  });
</script>

<div class="radar-card">
  <div class="channel-tabs">
    {#each channels as channel}
      <button 
        class="tab-btn" 
        class:active={activeChannel === channel}
        onclick={() => switchChannel(channel)}
      >
        {channel}
      </button>
    {/each}
  </div>

  <div class="news-content">
    {#if isLoading}
      <div class="loading-state">
        <span class="dot-pulse"></span> 雷达扫描中...
      </div>
    {:else}
      <ul class="news-list">
        {#each newsList as news, index}
          <li class="news-item">
            <span class="index-badge" class:top-three={index < 3}>{index + 1}</span>
            <span class="news-text">{news}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .radar-card {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
  }

  /* 频道标签样式 */
  .channel-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid #f5f5f7;
    padding-bottom: 10px;
  }

  .tab-btn {
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: #888;
    padding: 4px 8px;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
  }

  .tab-btn.active {
    color: #333;
    font-weight: 600;
  }

  /* 激活状态的下划线指示器 */
  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -11px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 3px;
    background-color: #333;
    border-radius: 2px;
  }

  /* 列表样式 */
  .news-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .news-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    line-height: 1.5;
  }

  /* 序号角标设计 */
  .index-badge {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f2;
    color: #888;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    margin-top: 2px;
  }

  /* 前三名使用高亮颜色 */
  .index-badge.top-three {
    background: #ff453a;
    color: #fff;
  }

  .news-text {
    font-size: 14px;
    color: #333;
    /* 核心逻辑：超出两行自动省略，不让信息过载 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .loading-state {
    font-size: 13px;
    color: #999;
    text-align: center;
    padding: 20px 0;
  }
</style>