<script>
  import { onMount, onDestroy } from 'svelte';
  import { exportDatabase, importDatabase } from '../lib/db';
  import Peer from 'peerjs';
  import QRCode from 'qrcode';
  import { Html5QrcodeScanner } from 'html5-qrcode';
  import { fade, slide } from 'svelte/transition';

  let { onBack } = $props();

  // 状态管理
  let myKey = $state('');
  let targetKey = $state('');
  let status = $state('正在生成身份标识...'); // 界面提示信息
  let isConnecting = $state(false);
  let showScanner = $state(false);
  
  let peerInstance = null;
  let qrCanvas;
  let scannerInstance = null;

  // 1. 指纹码生成算法 (剔除易混淆字符)
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

  // 初始化设备身份与 PeerJS 监听
  onMount(() => {
    // 读取或生成专属 Key
    let savedKey = localStorage.getItem('device_sync_key');
    if (!savedKey) {
      savedKey = generateIdentityKey();
      localStorage.setItem('device_sync_key', savedKey);
    }
    myKey = savedKey;

    // 绘制二维码
    if (qrCanvas) {
      QRCode.toCanvas(qrCanvas, myKey, { width: 180, margin: 2, color: { dark: '#1d1d1f', light: '#ffffff' } });
    }

    // 初始化 PeerJS (加个前缀防止在公共服务器上与别人的应用撞车)
    peerInstance = new Peer(`lucky-pwa-${myKey.replace(/-/g, '')}`);
    
    peerInstance.on('open', (id) => {
      status = '设备已就绪，等待连接...';
    });

    // --- 核心：被动接收数据逻辑 ---
    peerInstance.on('connection', (conn) => {
      status = '🔗 发现远端设备，正在建立通道...';
      conn.on('data', async (data) => {
        if (data.type === 'SYNC_PAYLOAD') {
          status = '📦 正在接收数据...';
          const success = await importDatabase(data.payload);
          if (success) {
            status = '✅ 同步完成！数据已更新。';
            setTimeout(() => onBack(), 2000); // 同步成功后自动返回主页
          } else {
            status = '❌ 同步写入失败。';
          }
        }
      });
    });
  });

  onDestroy(() => {
    if (peerInstance) peerInstance.destroy();
    if (scannerInstance) scannerInstance.clear();
  });

  // --- 核心：主动发送数据逻辑 ---
  async function connectAndSync() {
    if (!targetKey.trim()) {
      alert("请输入对方的指纹码"); return;
    }
    isConnecting = true;
    status = '正在打包本地数据...';
    
    const payload = await exportDatabase();
    
    status = '正在呼叫远端设备...';
    // 规范化输入的 Key
    const normalizedTarget = targetKey.replace(/-/g, '').toUpperCase();
    const conn = peerInstance.connect(`lucky-pwa-${normalizedTarget}`);

    conn.on('open', () => {
      status = '🔗 通道已建立，正在发射数据...';
      conn.send({ type: 'SYNC_PAYLOAD', payload: payload });
      
      setTimeout(() => {
        status = '✅ 数据发送完毕！';
        isConnecting = false;
      }, 1000);
    });

    conn.on('error', (err) => {
      status = '❌ 连接失败，请检查目标设备是否在线。';
      isConnecting = false;
    });
  }

  // --- 扫码逻辑 ---
  function startScanner() {
    showScanner = true;
    // 延迟一点等 DOM 渲染
    setTimeout(() => {
      scannerInstance = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      scannerInstance.render((decodedText) => {
        // 扫码成功
        targetKey = decodedText;
        scannerInstance.clear();
        showScanner = false;
        // 自动触发连接
        connectAndSync();
      }, (err) => { /* 忽略扫描过程中的错误 */ });
    }, 100);
  }
</script>

<div class="sync-container">
  <header class="header">
    <button class="back-btn" onclick={onBack}>
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10.5 18.5L2 10L10.5 1.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      返回
    </button>
    <h2 class="title">多端无缝流转</h2>
    <div style="width: 40px;"></div> </header>

  <div class="content-scroll">
    <section class="card my-device-card">
      <h3 class="card-title">本机身份标识</h3>
      <p class="subtitle">将此设备的数据覆盖到另一台设备，请用另一台设备扫描此码。</p>
      
      <div class="qr-wrapper">
        <canvas bind:this={qrCanvas}></canvas>
      </div>
      
      <div class="key-display">{myKey}</div>
      <div class="status-bar" class:success={status.includes('✅')} class:error={status.includes('❌')}>
        {status}
      </div>
    </section>

    <section class="card target-device-card">
      <h3 class="card-title">提取云端/远端数据</h3>
      <p class="subtitle">拉取另一台设备的数据覆盖至本机。</p>

      {#if showScanner}
        <div id="reader" class="scanner-box" in:slide></div>
        <button class="mac-btn secondary full-width" style="margin-top: 10px;" onclick={() => {scannerInstance.clear(); showScanner = false;}}>取消扫描</button>
      {:else}
        <div class="input-action-group">
          <input 
            type="text" 
            placeholder="输入目标设备指纹码..." 
            bind:value={targetKey} 
            class="mac-input uppercase-input"
          />
          <button class="mac-btn icon-btn" onclick={startScanner} title="扫码">
            📷
          </button>
        </div>
        <button class="mac-btn primary full-width" onclick={connectAndSync} disabled={isConnecting}>
          {isConnecting ? '同步中...' : '拉取并覆盖本机'}
        </button>
      {/if}
    </section>
  </div>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  
  .sync-container {
    position: fixed; inset: 0; background-color: #f5f5f7;
    z-index: 2000; display: flex; flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .header {
    display: flex; justify-content: space-between; align-items: center;
    padding: env(safe-area-inset-top) 16px 12px;
    background: #ffffff; border-bottom: 1px solid #d2d2d7;
  }

  .back-btn { background: none; border: none; font-size: 16px; color: #007aff; display: flex; align-items: center; cursor: pointer; }
  .title { font-size: 17px; font-weight: 600; color: #1d1d1f; margin: 0; }

  .content-scroll {
    flex: 1; overflow-y: auto; padding: 20px 16px;
  }

  .card {
    background: #ffffff; border-radius: 12px; padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px;
  }

  .card-title { margin: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #1d1d1f; }
  .subtitle { font-size: 13px; color: #86868b; margin: 0 0 20px 0; line-height: 1.4; }

  .qr-wrapper { display: flex; justify-content: center; margin-bottom: 16px; }
  canvas { border-radius: 8px; border: 1px solid #eee; }

  .key-display {
    text-align: center; font-size: 20px; font-weight: bold; letter-spacing: 2px;
    color: #1d1d1f; background: #f5f5f7; padding: 12px; border-radius: 8px; margin-bottom: 16px;
  }

  .status-bar { text-align: center; font-size: 13px; color: #007aff; }
  .status-bar.success { color: #34c759; }
  .status-bar.error { color: #ff3b30; }

  .input-action-group { display: flex; gap: 8px; margin-bottom: 16px; }
  
  .mac-input {
    flex: 1; padding: 12px; border: 1px solid #d2d2d7; border-radius: 8px;
    font-size: 15px; color: #1d1d1f; outline: none; transition: border-color 0.2s;
  }
  .mac-input:focus { border-color: #007aff; }
  .uppercase-input { text-transform: uppercase; }

  .mac-btn {
    padding: 12px; border-radius: 8px; font-size: 15px; font-weight: 500; border: none; cursor: pointer; transition: transform 0.1s;
  }
  .mac-btn:active { transform: scale(0.98); }
  .mac-btn.primary { background: #007aff; color: #ffffff; }
  .mac-btn.secondary { background: #e5e5ea; color: #1d1d1f; }
  .mac-btn.icon-btn { background: #f5f5f7; width: 46px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .full-width { width: 100%; }

  .scanner-box { width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #d2d2d7; }
</style>