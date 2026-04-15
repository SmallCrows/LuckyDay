<script>
  // 引入刚才创建的子组件 (此时它们还只是占位符)
  import StatusBar from './components/StatusBar.svelte';
  import WeatherCard from './components/WeatherCard.svelte';
  import Calendar from './components/Calendar.svelte';
  import AlertBanner from './components/AlertBanner.svelte';
  import ZodiacFortune from './components/ZodiacFortune.svelte';

  // 全局状态变量：当前选中的日期，默认是今天
  let selectedDate = new Date();
</script>

<main class="app-container">
  
  <header class="fixed-top-section">
    <StatusBar />
    <WeatherCard />
    <Calendar bind:currentDate={selectedDate} />
  </header>

  <section class="scrollable-bottom-section">
    <AlertBanner />
    <ZodiacFortune {selectedDate} />
    
    <!-- <div class="placeholder-box">功能扩展区 1</div>
    <div class="placeholder-box">功能扩展区 2</div> -->
  </section>

</main>

<style>
  /* --- 全局重置与基础设置 --- */
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f5f5f7; /* 苹果风格的浅灰底色 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow: hidden; /* 彻底禁用 body 层的默认滚动，防止 iOS 橡皮筋效应带来的布局错乱 */
  }

  /* --- 骨架布局核心 --- */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh; 
    width: 100%; /* 新增这一行：强制撑开宽度 */
    max-width: 768px; /* 在电脑宽屏上最大宽为 768px（类似 iPad 竖屏），并居中显示 */
    margin: 0 auto;
    background-color: #ffffff;
    box-shadow: 0 0 20px rgba(0,0,0,0.05);
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