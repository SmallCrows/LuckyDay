<script>
  // 引入刚才创建的子组件 (此时它们还只是占位符)
  import StatusBar from './components/StatusBar.svelte';
  import WeatherCard from './components/WeatherCard.svelte';
  import Calendar from './components/Calendar.svelte';
  import AlertBanner from './components/AlertBanner.svelte';
  import ZodiacFortune from './components/ZodiacFortune.svelte';
  import Almanac from './components/Almanac.svelte'; 
  import UserEvents from './components/UserEvents.svelte';
  import PwaInstallPrompt from './components/PwaInstallPrompt.svelte';
  import NewsLiveView from './components/NewsLiveView.svelte';

  let currentView = $state('main'); // 'main' 或 'news'
  // 全局状态变量：当前选中的日期，默认是今天
  let selectedDate = $state(new Date());
  let showUserEventForm = $state(false); // 控制输入框显隐

  // 模拟在线状态
  let isOnline = $state(true);
</script>

<main class="app-container">

{#if currentView === 'main'}
    <button class="side-news-trigger" onclick={() => currentView = 'news'}>
      <span class="pulse-dot"></span>
      简讯
    </button>

  <header class="fixed-top-section">
    <StatusBar />
    <WeatherCard />
    <Calendar 
      bind:currentDate={selectedDate} 
      onAddTask={() => showUserEventForm = !showUserEventForm} 
    />
  </header>

  <section class="scrollable-bottom-section">
  <!--
    <AlertBanner />
    -->
    
    <UserEvents 
      {selectedDate} 
      bind:showForm={showUserEventForm} 
    />
    
    <Almanac {selectedDate} />
    <ZodiacFortune {selectedDate} />

  <PwaInstallPrompt />  
  </section>
{:else}
    <NewsLiveView 
      onBack={() => currentView = 'main'} 
      {isOnline}
    />
  {/if}

  
</main>

<style>

/* 侧边简讯按钮：固定在左侧 */
  .side-news-trigger {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 99;
    background: rgba(51, 51, 51, 0.9);
    color: white;
    padding: 12px 6px;
    border: none;
    border-radius: 0 12px 12px 0;
    font-size: 12px;
    writing-mode: vertical-rl; /* 文字竖排 */
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    background: #34c759;
    border-radius: 50%;
    margin-bottom: 4px;
    box-shadow: 0 0 0 rgba(52, 199, 89, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(52, 199, 89, 0); }
    100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
  }

  /* --- 全局重置与基础设置 --- */
  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: #f5f5f7; /* 苹果风格的浅灰底色 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow: hidden; /* 彻底禁用 body 层的默认滚动，防止 iOS 橡皮筋效应带来的布局错乱 */
  }

  /* --- 骨架布局核心 --- */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100dvh; 
    width: 100%; /* 新增这一行：强制撑开宽度 */
    max-width: 768px; /* 在电脑宽屏上最大宽为 768px（类似 iPad 竖屏），并居中显示 */
    margin: 0 auto;
    background-color: #ffffff;
    box-shadow: 0 0 20px rgba(0,0,0,0.05);
    /* 确保容器本身不产生滚动，由内部 section 控制 */
    overflow: hidden; 
    position: relative;
  }

  .fixed-top-section {
    flex-shrink: 0; /* 绝对禁止被挤压变形 */
    background-color: #ffffff;
    z-index: 10;
    border-bottom: 1px solid #eeeeee; /* 与下方滑动区做个视觉分割 */
    padding-bottom: 10px;
  }

  .scrollable-bottom-section {
    flex-grow: 1; /* 霸占剩下的所有空间 */
    overflow-y: auto; /* 核心：内容超出时出现垂直滚动条 */
    padding: 15px;
    background-color: #f9f9f9;
    /* 开启原生 iOS 平滑滚动阻尼效果 */
    -webkit-overflow-scrolling: touch; 
  }

  /* 仅用于演示的占位符样式，后续可删除 */
  .placeholder-box {
    height: 300px;
    background-color: #e0e0e0;
    border-radius: 12px;
    margin-top: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }

  /* --- Mac 风格滚动条定制 --- */
  
  /* 1. 设置滚动条的整体宽度 */
  .scrollable-bottom-section::-webkit-scrollbar {
    width: 6px; 
  }

  /* 2. 滚动条的轨道（背景）设为透明，不抢视线 */
  .scrollable-bottom-section::-webkit-scrollbar-track {
    background: transparent; 
  }

  /* 3. 滚动条的滑块（手柄） */
  .scrollable-bottom-section::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15); /* 极浅的半透明黑色 */
    border-radius: 10px; /* Mac 标志性的大圆角 */
  }

  /* 4. 鼠标悬停在滑块上时，颜色稍微加深，提供交互反馈 (仅在 PC 端有效) */
  .scrollable-bottom-section::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3); 
  }
</style>