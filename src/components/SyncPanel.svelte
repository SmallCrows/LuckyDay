<script>
  import { onMount, onDestroy } from 'svelte';
  import { exportDatabase, importDatabase } from '../lib/db';
  import Peer from 'peerjs';
  import QRCode from 'qrcode';
  // 核心变更：引入底层的 Html5Qrcode，而不是带 UI 的 Scanner
  import { Html5Qrcode } from 'html5-qrcode';
  import { fade, slide } from 'svelte/transition';

  let { onBack } = $props();

  let myKey = $state('');
  let targetKey = $state('');
  let status = $state('正在初始化加密通道...'); 
  let isConnecting = $state(false);
  let showScanner = $state(false);
  
  let peerInstance = null;
  let qrCanvas;
  
  // 核心变更：管理底层扫描器实例
  let html5QrCode = null;
  let fileInput;

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
          { urls: 'stun:stun.qq.com:3478' },
          { urls: 'stun:stun.miwifi.com:3478' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    
    peerInstance.on('open', (id) => {
      status = '设备已就绪，雷达静默监听中...';
    });

    peerInstance.on('connection', (conn) => {
      status = '🔗 远端设备已接入...';
      
      conn.on('open', () => {
        status = '✅ 通道已锁定，等待远端指令...';
      });

      conn.on('data', async (data) => {
        if (data.type === 'PULL_REQUEST') {
          status = '📤 远端正在拉取本机数据，打包中...';
          const payload = await exportDatabase();
          conn.send({ type: 'SYNC_PAYLOAD', payload: payload });
          status = '✅ 数据已成功发射至远端！';
        }
      });

      conn.on('error', (err) => {
        status = '❌ 通道断开。';
      });
    });
  });

  onDestroy(() => {
    if (peerInstance) peerInstance.destroy();
    stopScanner(); // 确保组件销毁时关闭摄像头
  });

  async function connectAndPull() {
    if (!targetKey.trim()) {
      alert("请输入目标指纹码"); return;
    }
    isConnecting = true;
    
    const cleanTarget = targetKey.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    status = '定向呼叫目标设备，执行穿透协议...';
    
    const conn = peerInstance.connect(`lucky-pwa-${cleanTarget}`);

    let connectionTimeout = setTimeout(() => {
      if (isConnecting) {
        status = '❌ 穿透失败。网络防火墙拦截，建议使用下方「离线文件流转」。';
        isConnecting = false;
      }
    }, 15000);

    conn.on('open', () => {
      status = '🔗 穿透成功，请求目标发送数据...';
      conn.send({ type: 'PULL_REQUEST' });
    });

    conn.on('data', async (data) => {
      if (data.type === 'SYNC_PAYLOAD') {
        clearTimeout(connectionTimeout);
        status = '📦 正在接收并解包数据...';
        
        const success = await importDatabase(data.payload);
        if (success) {
          status = '✅ 数据覆盖完成，核心重启中...';
          setTimeout(() => onBack(), 1500); 
        } else {
          status = '❌ 本地写入异常。';
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

  // --- 核心变更：纯净的底层硬件调用逻辑 ---
  function startScanner() {
    showScanner = true;
    
    setTimeout(() => {
      html5QrCode = new Html5Qrcode("reader");
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      const onScanSuccess = (decodedText) => {
        targetKey = decodedText;
        stopScanner(); // 扫码成功后立刻关闭摄像头
        connectAndPull();
      };
      const onScanFailure = (err) => { /* 忽略扫描过程中的无帧错误 */ };

      // 1. 优先强制开启后置摄像头 (environment)
      html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch(err => {
          // 2. 如果设备没有后置（比如电脑），自动降级使用前置或默认摄像头 (user)
          console.log("无法调用后置摄像头，尝试默认摄像头...", err);
          html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure)
            .catch(fallbackErr => {
              alert("无法访问摄像头，请确保已授予权限。");
              showScanner = false;
            });
        });
    }, 100);
  }

  // 独立出关闭摄像头的逻辑
  function stopScanner() {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        html5QrCode.clear();
        html5QrCode = null;
      }).catch(err => {
        console.warn("停止摄像头时发生异常", err);
      });
    }
    showScanner = false;
  }

  async function exportToFile() {
    try {
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lucky_sync_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出快照失败');
    }
  }

  function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.timestamp) throw new Error("无效的备份文件");
        const success = await importDatabase(data);
        if (success) {
          alert('数据覆盖成功！');
          onBack();
        }
      } catch (err) {
        alert('解析文件失败，请确保选择了正确的备份文件。');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
      <h3 class="card-title">无线 P2P 拉取</h3>
      <p class="subtitle">拉取目标设备的数据并覆盖本机。</p>

      {#if showScanner}
        <div id="reader" class="scanner-box" in:slide></div>
        <button class="mac-btn secondary full-width" style="margin-top: 10px;" onclick={stopScanner}>终止扫描</button>
      {:else}
        <div class="input-action-group">
          <input 
            type="text" 
            placeholder="输入目标指纹码..." 
            bind:value={targetKey} 
            class="mac-input uppercase-input"
          />
          <button class="mac-btn icon-btn" onclick={startScanner} title="调取摄像头">
            📷
          </button>
        </div>
        <button class="mac-btn primary full-width" onclick={connectAndPull} disabled={isConnecting}>
          {isConnecting ? '穿透执行中...' : '建立连接并拉取'}
        </button>
      {/if}
    </section>

    <section class="card file-sync-card">
      <h3 class="card-title">离线文件流转</h3>
      <p class="subtitle">当 P2P 网络被防火墙阻断时，可直接通过文件导出/导入完成数据转移。</p>
      <div class="file-action-group">
        <button class="mac-btn secondary full-width" onclick={exportToFile}>
          📦 导出本机数据快照
        </button>
        <button class="mac-btn secondary full-width" onclick={() => fileInput.click()}>
          📥 载入外部数据快照
        </button>
        <input 
          type="file" 
          accept=".json" 
          bind:this={fileInput} 
          onchange={importFromFile} 
          style="display: none;" 
        />
      </div>
    </section>
  </div>
</div>

<style>
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
  
  .file-action-group { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }

  .mac-btn { padding: 12px; border-radius: 8px; font-size: 15px; font-weight: 500; border: none; cursor: pointer; transition: transform 0.1s; }
  .mac-btn:active { transform: scale(0.98); }
  .mac-btn.primary { background: #007aff; color: #ffffff; }
  .mac-btn.secondary { background: #e5e5ea; color: #1d1d1f; }
  .mac-btn.icon-btn { background: #f5f5f7; width: 46px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .full-width { width: 100%; }

  /* 隐藏底部不需要的 html5-qrcode 库自带的控制条 */
  .scanner-box { width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #d2d2d7; background: #000; }
  :global(#reader__dashboard_section_csr) { display: none !important; }
  :global(#reader__dashboard_section_swaplink) { display: none !important; }
</style>