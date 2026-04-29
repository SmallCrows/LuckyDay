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
  import Bookshelf from './components/Bookshelf.svelte';
  import Reader from './components/Reader.svelte'; // 确保引入了阅读器

  // 初始化本地数据库
  import { onMount } from 'svelte';
  import { initDatabaseIfNeeded } from './lib/db';

  onMount(async () => {
    await initDatabaseIfNeeded();
  });

  let currentView = $state('main'); // 'main' | 'news' | 'bookshelf' | 'reader'
  let selectedDate = $state(new Date());
  let showUserEventForm = $state(false); 
  let selectedBookId = $state(null);

  let isOnline = $state(true);

  // 打开书籍的处理函数
  function openBook(id) {
    selectedBookId = id;
    currentView = 'reader';
  }
</script>

<main class="app-container">

{#if currentView === 'main'}
    <div class="side-trigger-group">
      <button class="side-news-trigger" onclick={() => currentView = 'news'}>
        <span class="pulse-dot"></span>
        简讯
      </button>

      <button class="side-books-trigger" onclick={() => currentView = 'bookshelf'}>
        典籍
      </button>
    </div>

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
      onOpenBook={openBook} 
    />

{:else if currentView === 'reader'}
    <Reader 
      bookId={selectedBookId} 
      onBack={() => currentView = 'bookshelf'} 
    />
{/if}
  
</main>

<style>
  /* --- 侧边悬浮按钮组 (均靠左对齐) --- */
  
  /* 简讯按钮 */
  .side-news-trigger {
    position: fixed;
    left: 0;
    /* 适配安全区，起始高度 */
    top: max(20px, calc(env(safe-area-inset-top) + 10px)); 
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

  /* 典籍按钮：位置移动到左侧，top 值增加偏移量以排在简讯下方 */
  .side-books-trigger {
    position: fixed;
    left: 0;
    /* 简讯按钮高度 + 间距，约 80px 的总偏移 */
    top: calc(max(20px, calc(env(safe-area-inset-top) + 10px)) + 80px); 
    z-index: 9999;
    background: rgba(105, 89, 75, 0.95); /* 古典墨色 */
    color: #fcfbf9;
    padding: 12px 6px;
    border: none;
    border-radius: 0 12px 12px 0; /* 圆角改到右侧，与简讯一致 */
    font-size: 12px;
    writing-mode: vertical-rl; 
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow: 2px 0 10px rgba(0,0,0,0.15); /* 阴影改到右侧 */
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

  /* --- 基础容器设置保持不变 --- */
  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: #f5f5f7; 
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    overflow: hidden; 
  }

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

  .scrollable-bottom-section::-webkit-scrollbar { width: 6px; }
  .scrollable-bottom-section::-webkit-scrollbar-thumb { background-color: rgba(0, 0, 0, 0.15); border-radius: 10px; }
</style>