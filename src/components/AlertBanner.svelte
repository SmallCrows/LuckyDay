<script>
  // 使用 $state 存储预警数据数组
  // 等对接真实 API 时，如果接口没返回预警，把这个数组设为 [] 即可，组件会自动隐藏
  let alerts = $state([
    {
      id: 1,
      type: 'warning', // 预留不同级别：warning (橙色), danger (红色)
      title: '🌩️ 雷电黄色预警',
      content: '预计今日下午 14:00 - 18:00 本市大部分地区将出现雷阵雨天气，局地伴有短时强降水和7-8级阵风，请注意防范。'
    }
  ]);

  // 提供一个关闭按钮功能，用户看完可以手动关掉提示
  function dismissAlert(id) {
    alerts = alerts.filter(a => a.id !== id);
  }
</script>

{#if alerts.length > 0}
  <div class="alert-container">
    {#each alerts as alert (alert.id)}
      <div class="alert-banner {alert.type}">
        <div class="alert-header">
          <span class="alert-title">{alert.title}</span>
          <button class="close-btn" onclick={() => dismissAlert(alert.id)}>×</button>
        </div>
        <div class="alert-content">
          {alert.content}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .alert-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .alert-banner {
    padding: 12px 16px;
    border-radius: 12px;
    position: relative;
  }

  /* 橙色预警样式 (黄色/橙色级别) */
  .alert-banner.warning {
    background-color: #fff8e6;
    border: 1px solid #ffe5b4;
  }
  .alert-banner.warning .alert-title {
    color: #d97706;
  }
  .alert-banner.warning .alert-content {
    color: #b45309;
  }

  /* 红色预警样式 (红色级别) */
  .alert-banner.danger {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }
  .alert-banner.danger .alert-title {
    color: #dc2626;
  }
  .alert-banner.danger .alert-content {
    color: #991b1b;
  }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .alert-title {
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    line-height: 1;
    color: inherit;
    opacity: 0.5;
    cursor: pointer;
    padding: 0 4px;
    transition: opacity 0.2s;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .alert-content {
    font-size: 13px;
    line-height: 1.5;
    opacity: 0.9;
  }
</style>