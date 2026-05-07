<script>
  import { onMount, onDestroy } from 'svelte';
  import { exportDatabase, importDatabase } from '../lib/db';
  import Peer from 'peerjs';
  import QRCode from 'qrcode';
  import { Html5QrcodeScanner } from 'html5-qrcode';
  import { fade, slide } from 'svelte/transition';

  let { onBack } = $props();

  let myKey = $state('');
  let targetKey = $state('');
  let status = $state('正在初始化加密通道...'); 
  let isConnecting = $state(false);
  let showScanner = $state(false);
  
  let peerInstance = null;
  let qrCanvas;
  let scannerInstance = null;

  function generateIdentityKey() {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let key = '';
    const randomValues = new Uint32Array(12);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < 12; i++) {
      key += chars[randomValues[i] % chars.length];
    }
    return `${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}`;
  }

  onMount(() => {
    let savedKey = localStorage.getItem('device_sync_key');
    if (!savedKey) {
      savedKey = generateIdentityKey();
      localStorage.setItem('device_sync_key', savedKey);
    }
    myKey = savedKey;

    if (qrCanvas) {
      QRCode.toCanvas(qrCanvas, myKey, { width: 180, margin: 2, color: { dark: '#1d1d1f', light: '#ffffff' } });
    }

    const cleanMyKey = myKey.replace(/[^A-Z0-9]/gi, '');
    peerInstance = new Peer(`lucky-pwa-${cleanMyKey}`, {
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    
    peerInstance.on('open', (id) => {
      status = '设备已就绪，雷达静默监听中...';
    });

    // --- 【被动方：持有数据的手机】 ---
    peerInstance.on('connection', (conn) => {
      status = '🔗 远端设备已接入...';
      
      conn.on('open', () => {
        status = '✅ 通道已锁定，等待远端指令...';
      });

      // 监听远端发来的拉取请求
      conn.on('data', async (data) => {
        if (data.type === 'PULL_REQUEST') {
          status = '📤 远端正在拉取本机数据，打包中...';
          // 导出本机真实数据
          const payload = await exportDatabase();
          // 将数据发送给对方
          conn.send({ type: 'SYNC_PAYLOAD', payload: payload });
          status = '✅ 数据已成功发射至远端！';
        }
      });

      conn.on('error', (err) => {
        status = '❌ 通道断开，请重试。';
      });
    });
  });

  onDestroy(() => {
    if (peerInstance) peerInstance.destroy();
    if (scannerInstance) scannerInstance.clear();
  });

  // --- 【主动方：需要拉取数据的电脑】 ---
  async function connectAndPull() {
    if (!targetKey.trim()) {
      alert("必须输入有效的目标指纹码"); return;
    }
    isConnecting = true;
    
    const cleanTarget = targetKey.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    status = '定向呼叫目标设备，执行握手协议...';
    
    // 核心修复：移除 reliable: true 避免底层死锁
    const conn = peerInstance.connect(`lucky-pwa-${cleanTarget}`);

    // 增加防卡死超时机制（15秒）
    let connectionTimeout = setTimeout(() => {
      if (isConnecting) {
        status = '❌ 连接超时，请确保双方都在此页面并检查网络。';
        isConnecting = false;
      }
    }, 15000);

    conn.on('open', () => {
      status = '🔗 穿透成功，正在请求目标发送数据...';
      // 通道一打开，立刻向对方发送“给我数据”的请求
      conn.send({ type: 'PULL_REQUEST' });
    });

    conn.on('data', async (data) => {
      // 收到对方传回来的数据库快照
      if (data.type === 'SYNC_PAYLOAD') {
        clearTimeout(connectionTimeout);
        status = '📦 正在接收并解包数据...';
        
        const success = await importDatabase(data.payload);
        if (success) {
          status = '✅ 数据覆盖完成，核心重启中...';
          setTimeout(() => onBack(), 1500); 
        } else {
          status = '❌ 本地数据库写入发生异常。';
        }
        isConnecting = false;
      }
    });

    conn.on('error', (err) => {
      clearTimeout(connectionTimeout);
      status = '❌ WebRTC 穿透失败。';
      isConnecting = false;
    });
  }

  function startScanner() {
    showScanner = true;
    setTimeout(() => {
      scannerInstance = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      scannerInstance.render((decodedText) => {
        targetKey = decodedText;
        scannerInstance.clear();
        showScanner = false;
        connectAndPull();
      }, (err) => {});
    }, 100);
  }
</script>

<div class="sync-container">
  <header class="header">
    <button class="back-btn" onclick={onBack}>
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10.5 18.5L2 10L10.5 1.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      返回
    </button>
    <h2 class="title">数据链桥接</h2>
    <div style="width: 40px;"></div> 
  </header>

  <div class="content-scroll">
    <section class="card my-device-card">
      <h3 class="card-title">本机身份标识</h3>
      <p class="subtitle">如果想让其他设备拉取本机数据，请在其他设备扫描此码。</p>
      
      <div class="qr-wrapper">
        <canvas bind:this={qrCanvas}></canvas>
      </div>
      
      <div class="key-display">{myKey}</div>
      <div class="status-bar" class:success={status.includes('✅')} class:error={status.includes('❌')}>
        {status}
      </div>
    </section>

    <section class="card target-device-card">
      <h3 class="card-title">提取远端节点数据</h3>
      <p class="subtitle">拉取目标设备的数据并覆盖本机。</p>

      {#if showScanner}
        <div id="reader" class="scanner-box" in:slide></div>
        <button class="mac-btn secondary full-width" style="margin-top: 10px;" onclick={() => {scannerInstance.clear(); showScanner = false;}}>终止扫描序列</button>
      {:else}
        <div class="input-action-group">
          <input 
            type="text" 
            placeholder="输入目标指纹码..." 
            bind:value={targetKey} 
            class="mac-input uppercase-input"
          />
          <button class="mac-btn icon-btn" onclick={startScanner} title="调取光学传感器">
            📷
          </button>
        </div>
        <button class="mac-btn primary full-width" onclick={connectAndPull} disabled={isConnecting}>
          {isConnecting ? '协议执行中...' : '建立连接并拉取数据'}
        </button>
      {/if}
    </section>
  </div>
</div>

<style>
  /* 样式保持不变，确保视觉稳定性 */
  :global(*) { box-sizing: border-box; }
  .sync-container { position: fixed; inset: 0; background-color: #f5f5f7; z-index: 2000; display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .header { display: flex; justify-content: space-between; align-items: center; padding: env(safe-area-inset-top) 16px 12px; background: #ffffff; border-bottom: 1px solid #d2d2d7; }
  .back-btn { background: none; border: none; font-size: 16px; color: #007aff; display: flex; align-items: center; cursor: pointer; }
  .title { font-size: 17px; font-weight: 600; color: #1d1d1f; margin: 0; }
  .content-scroll { flex: 1; overflow-y: auto; padding: 20px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px; }
  .card-title { margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #1d1d1f; }
  .subtitle { font-size: 13px; color: #86868b; margin: 0 0 20px 0; line-height: 1.4; }
  .qr-wrapper { display: flex; justify-content: center; margin-bottom: 16px; }
  canvas { border-radius: 8px; border: 1px solid #eee; }
  .key-display { text-align: center; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #1d1d1f; background: #f5f5f7; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
  .status-bar { text-align: center; font-size: 13px; color: #007aff; }
  .status-bar.success { color: #34c759; }
  .status-bar.error { color: #ff3b30; }
  .input-action-group { display: flex; gap: 8px; margin-bottom: 16px; }
  .mac-input { flex: 1; padding: 12px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 15px; color: #1d1d1f !important; background-color: #ffffff !important; outline: none; transition: border-color 0.2s; }
  .mac-input:focus { border-color: #007aff; }
  .uppercase-input { text-transform: uppercase; }
  .mac-btn { padding: 12px; border-radius: 8px; font-size: 15px; font-weight: 500; border: none; cursor: pointer; transition: transform 0.1s; }
  .mac-btn:active { transform: scale(0.98); }
  .mac-btn.primary { background: #007aff; color: #ffffff; }
  .mac-btn.secondary { background: #e5e5ea; color: #1d1d1f; }
  .mac-btn.icon-btn { background: #f5f5f7; width: 46px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .full-width { width: 100%; }
  .scanner-box { width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #d2d2d7; }
</style>