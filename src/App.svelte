<script>
  // 引入子组件
  import StatusBar from './components/StatusBar.svelte';
  import WeatherCard from './components/WeatherCard.svelte';
  import Calendar from './components/Calendar.svelte';
  import AlertBanner from './components/AlertBanner.svelte';
  import ZodiacFortune from './components/ZodiacFortune.svelte';
  import Almanac from './components/Almanac.svelte'; 
  import UserEvents from './components/UserEvents.svelte';
  import PwaInstallPrompt from './components/PwaInstallPrompt.svelte';
  import NewsLiveView from './components/NewsLiveView.svelte';
  import Bookshelf from './components/Bookshelf.svelte'; // 新增：引入书架组件
  import Reader from './components/Reader.svelte'; // 新增：引入书架组件

  // 初始化本地数据库
  import { onMount } from 'svelte';
  import { initDatabaseIfNeeded } from './lib/db';

  onMount(async () => {
    // PWA 启动时静默检查并初始化数据库
    await initDatabaseIfNeeded();
  });

  // 视图控制器增加 'bookshelf' 状态
  let currentView = $state('main'); // 'main' | 'news' | 'bookshelf'
  
  let selectedDate = $state(new Date());
  let showUserEventForm = $state(false); 

  let isOnline = $state(true);


  let selectedBookId = $state(null); // 记录当前正在阅读的书籍 ID

 
</script>

<main class="app-container">

{#if currentView === 'main'}
    <button class="side-news-trigger" onclick={() => currentView = 'news'}>
      <span class="pulse-dot"></span>
      简讯
    </button>

    <button class="side-books-trigger" onclick={() => currentView = 'bookshelf'}>
      典籍
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
    <UserEvents 
      {selectedDate} 
      bind:showForm={showUserEventForm} 
    />
    <Almanac {selectedDate} />
    <ZodiacFortune {selectedDate} />
    <PwaInstallPrompt />  
  </section>

{:else if currentView === 'news'}
    <NewsLiveView 
      onBack={() => currentView = 'main'} 
      {isOnline}
    />

{:else if currentView === 'bookshelf'}
    <Bookshelf 
      onBack={() => currentView = 'main'} 
      onOpenBook={(id) => {
        selectedBookId = id;    // 1. 记录选了哪本书
        currentView = 'reader'; // 2. 切换到阅读器视图
      }} 
    />

{:else if currentView === 'reader'}
    <Reader 
      bookId={selectedBookId} 
      onBack={() => currentView = 'bookshelf'} 
    />
{/if}
</main>

<style>
  /* --- 侧边悬浮按钮 --- */
  
  /* 左侧简讯按钮 */
  .side-news-trigger {
    position: fixed;
    left: 0;
    top: max(0px, env(safe-area-inset-top)); 
    z-index: 9999;
    background: rgba(51, 51, 51, 0.9);
    color: white;
    padding: 12px 6px;
    border: none;
    border-radius: 0 12px 12px 0;
    font-size: 12px;
    writing-mode: vertical-rl; 
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 右侧典籍按钮 (新增) */
  .side-books-trigger {
    position: fixed;
    right: 0;
    top: max(0px, env(safe-area-inset-top)); 
    z-index: 9999;
    background: rgba(105, 89, 75, 0.95); /* 采用古典的深褐/墨色 */
    color: #fcfbf9;
    padding: 12px 6px;
    border: none;
    border-radius: 12px 0 0 12px; /* 圆角在左侧 */
    font-size: 12px;
    writing-mode: vertical-rl; 
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow: -2px 0 10px rgba(0,0,0,0.15);
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
    background-color: #f5f5f7; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow: hidden; 
  }

  /* --- 骨架布局核心 --- */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100dvh; 
    width: 100%; 
    max-width: 768px;
    margin: 0 auto;
    background-color: #ffffff;
    box-shadow: 0 0 20px rgba(0,0,0,0.05);
    overflow: hidden; 
    position: relative;
  }

  .fixed-top-section {
    flex-shrink: 0; 
    background-color: #ffffff;
    z-index: 10;
    border-bottom: 1px solid #eeeeee; 
    padding-bottom: 10px;
  }

  .scrollable-bottom-section {
    flex-grow: 1; 
    overflow-y: auto;
    padding: 15px;
    background-color: #f9f9f9;
    -webkit-overflow-scrolling: touch;
  }

  /* --- Mac 风格滚动条定制 --- */
  .scrollable-bottom-section::-webkit-scrollbar {
    width: 6px;
  }

  .scrollable-bottom-section::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollable-bottom-section::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 10px; 
  }

  .scrollable-bottom-section::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
</style>