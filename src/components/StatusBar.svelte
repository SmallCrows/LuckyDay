<script>
  // 使用 Svelte 5 的 $state 定义响应式变量，默认假设在线
  let isOnline = $state(true);

  // 使用 $effect 处理浏览器生命周期内的事件监听
  $effect(() => {
    // 组件挂载时，获取当前真实的物理网络状态
    isOnline = navigator.onLine;

    const handleOnline = () => isOnline = true;
    const handleOffline = () => isOnline = false;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 组件销毁时，清理监听器防止内存泄漏
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
</script>

<div class="status-bar">
  <div class="left-action"></div>

  <div class="title">
    Lucky Day
  </div>

  <div class="right-action">
    <div class="status-indicator">
      <span class="dot" class:online={isOnline} class:offline={!isOnline}></span>
      <span class="text">{isOnline ? '在线' : '离线'}</span>
    </div>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #ffffff;
    /* 苹果风格的细微底部阴影，替代生硬的边框 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); 
  }

  /* 保证左、中、右三块区域宽度对等，让标题绝对居中 */
  .left-action, .right-action {
    flex: 1;
    display: flex;
  }

  .right-action {
    justify-content: flex-end;
  }

  .title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #333333;
    letter-spacing: 0.5px;
    white-space: nowrap; /* 新增：强制应用名不换行 */
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666666;
    white-space: nowrap; /* 新增：强制在线/离线文字不换行 */
  }

  /* 指示灯圆点样式 */
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }

  .dot.online {
    background-color: #34c759; /* iOS 绿色 */
    box-shadow: 0 0 4px rgba(52, 199, 89, 0.4);
  }

  .dot.offline {
    background-color: #ff3b30; /* iOS 红色 */
    box-shadow: 0 0 4px rgba(255, 59, 48, 0.4);
  }

  .text {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
</style>