<script>
  import { onMount } from 'svelte';

  let deferredPrompt = $state(null);
  let showBanner = $state(false);

  onMount(() => {
    // 拦截浏览器默认安装弹窗
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      // 存储事件，后续点击按钮时调用
      deferredPrompt = e;
      showBanner = true;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 监听安装成功
    window.addEventListener('appinstalled', () => {
      showBanner = false;
      deferredPrompt = null;
      console.log('应用已成功安装');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  });

  async function triggerInstall() {
    if (!deferredPrompt) return;
    
    // 显示浏览器原生的安装确认框
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('用户接受了安装');
    }
    
    // 无论结果如何，清空状态
    deferredPrompt = null;
    showBanner = false;
  }
</script>

{#if showBanner}
  <div class="install-banner">
    <div class="info">
      <div class="title">安装到桌面</div>
      <div class="subtitle">像原生应用一样快速开启、离线使用</div>
    </div>
    <div class="actions">
      <button class="btn-cancel" onclick={() => showBanner = false}>稍后再说</button>
      <button class="btn-confirm" onclick={triggerInstall}>立即体验</button>
    </div>
  </div>
{/if}

<style>
  .install-banner {
    position: fixed;
    bottom: 24px;
    left: 16px;
    right: 16px;
    background: #ffffff;
    padding: 20px;
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    border: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .subtitle {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  button {
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: #f5f5f7;
    color: #666;
  }

  .btn-confirm {
    background: #007aff;
    color: #fff;
  }

  .btn-confirm:active {
    transform: scale(0.95);
    background: #0062cc;
  }
</style>