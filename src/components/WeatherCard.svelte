<script>
  // --- 配置区域 ---
  const QWEATHER_KEY = '你的和风天气API_KEY'; 
  
  // 增加页面状态： 'loading' | 'success' | 'failed'
  let viewState = $state('loading'); 
  let manualCityName = $state('');

  let weather = $state({
    city: '--',
    today: { text: '--', temp: '--°C', humidity: '--%', uv: '--', icon: '⛅' },
    tomorrow: { text: '--', temp: '--°C', humidity: '--%', uv: '--', icon: '☁️' }
  });

  function getWeatherEmoji(iconCode) {
    const map = { '100': '☀️', '101': '⛅', '104': '☁️', '300': '🌧️', '305': '🌦️', '400': '🌨️', '404': '🌨️', '501': '🌫️', '302': '⛈️' };
    return map[iconCode] || '🌤️';
  }

  function getUVText(index) {
    const uv = parseInt(index);
    if (uv <= 2) return '最弱';
    if (uv <= 4) return '弱';
    if (uv <= 6) return '中等';
    if (uv <= 9) return '强';
    return '极强';
  }

  // 核心拉取逻辑（根据 location 字符串，可能是 IP、坐标或城市名）
  async function fetchWeatherDataByLocation(locationQuery) {
    try {
      // 1. 通过查询词获取精确的 City ID
      const geoRes = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${locationQuery}&key=${QWEATHER_KEY}`);
      const geoData = await geoRes.json();
      
      if (geoData.code !== '200' || !geoData.location || geoData.location.length === 0) {
        throw new Error('未找到该城市');
      }
      
      const targetLocationId = geoData.location[0].id;
      const targetCityName = geoData.location[0].name;

      // 2. 拉取天气
      const weatherRes = await fetch(`https://devapi.qweather.com/v7/weather/3d?location=${targetLocationId}&key=${QWEATHER_KEY}`);
      const weatherData = await weatherRes.json();

      if (weatherData.code === '200' && weatherData.daily) {
        const t0 = weatherData.daily[0];
        const t1 = weatherData.daily[1];

        weather = {
          city: targetCityName,
          today: { text: t0.textDay, temp: `${t0.tempMax}°C`, humidity: `${t0.humidity}%`, uv: getUVText(t0.uvIndex), icon: getWeatherEmoji(t0.iconDay) },
          tomorrow: { text: t1.textDay, temp: `${t1.tempMax}°C`, humidity: `${t1.humidity}%`, uv: getUVText(t1.uvIndex), icon: getWeatherEmoji(t1.iconDay) }
        };
        
        viewState = 'success'; // 切换到成功视图

        // 更新缓存
        localStorage.setItem('weather_auto_cache', JSON.stringify({
          timestamp: Date.now(),
          data: weather
        }));
      }
    } catch (error) {
      console.error('获取气象数据失败:', error);
      viewState = 'failed'; // 切换到失败视图
    }
  }

  // 初始化获取逻辑 (尝试 IP 定位)
  async function initWeather() {
    const cachedString = localStorage.getItem('weather_auto_cache');
    if (cachedString) {
      const cacheData = JSON.parse(cachedString);
      if (Date.now() - cacheData.timestamp < 3600000) {
        weather = cacheData.data;
        viewState = 'success';
        return;
      }
    }

    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipRes.json();
      await fetchWeatherDataByLocation(ip);
    } catch (error) {
      console.warn('IP嗅探失败，进入手动模式', error);
      viewState = 'failed'; // IP 被拦截，直接展示备用 UI
    }
  }

  // --- 备选方案 1：请求 GPS 权限 ---
  function requestGPS() {
    if (!navigator.geolocation) {
      alert("您的浏览器不支持系统定位");
      return;
    }
    viewState = 'loading';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 和风支持直接传入 经度,纬度
        const query = `${position.coords.longitude.toFixed(2)},${position.coords.latitude.toFixed(2)}`;
        fetchWeatherDataByLocation(query);
      },
      (error) => {
        alert("定位权限被拒绝，请手动输入城市");
        viewState = 'failed';
      }
    );
  }

  // --- 备选方案 2：手动输入城市 ---
  function searchManual() {
    if (!manualCityName.trim()) return;
    viewState = 'loading';
    fetchWeatherDataByLocation(manualCityName.trim());
  }

  $effect(() => {
    if (QWEATHER_KEY !== '你的和风天气API_KEY') {
      initWeather();
    }
  });
</script>

<div class="weather-card">
  {#if viewState === 'success'}
    <div class="day-panel">
      <div class="header-row">
        <span class="day-title">今日 · {weather.city}</span>
        <span class="details">湿度 {weather.today.humidity} &nbsp;辐射 {weather.today.uv}</span>
      </div>
      <div class="main-row">
        <span class="icon">{weather.today.icon}</span>
        <span class="text">{weather.today.text}</span>
        <span class="temp">{weather.today.temp}</span>
      </div>
    </div>
    <div class="divider"></div>
    <div class="day-panel tomorrow">
      <div class="header-row">
        <span class="day-title">明日</span>
        <span class="details">湿度 {weather.tomorrow.humidity} &nbsp;辐射 {weather.tomorrow.uv}</span>
      </div>
      <div class="main-row">
        <span class="icon">{weather.tomorrow.icon}</span>
        <span class="text">{weather.tomorrow.text}</span>
        <span class="temp">{weather.tomorrow.temp}</span>
      </div>
    </div>

  {:else if viewState === 'failed'}
    <div class="fallback-panel">
      <div class="fallback-msg">无法获取位置，请选择：</div>
      <div class="fallback-actions">
        <button class="gps-btn" onclick={requestGPS}>获取定位权限</button>
        <span class="or-text">或</span>
        <div class="search-box">
          <input 
            type="text" 
            placeholder="如: 北京" 
            bind:value={manualCityName}
            onkeydown={(e) => e.key === 'Enter' && searchManual()}
          />
          <button class="search-btn" onclick={searchManual}>确认</button>
        </div>
      </div>
    </div>

  {:else}
    <div class="loading-panel">气象数据同步中...</div>
  {/if}
</div>

<style>
  .weather-card {
    display: flex;
    margin: 10px 16px;
    padding: 10px 14px; 
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
    min-height: 52px; /* 保证卡片有基础高度 */
  }

  /* --- 正常天气卡片样式 (保持不变) --- */
  .day-panel { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .day-panel.tomorrow { opacity: 0.85; }
  .divider { width: 1px; background-color: #f0f0f0; margin: 0 12px; }
  .header-row { display: flex; align-items: center; margin-bottom: 6px; }
  .day-title { font-size: 12px; color: #888888; font-weight: 500; }
  .details { flex: 1; text-align: center; font-size: 10px; color: #888888; }
  .main-row { display: flex; align-items: center; gap: 8px; }
  .icon { font-size: 22px; line-height: 1; }
  .text { font-size: 14px; font-weight: 500; color: #555555; }
  .temp { font-size: 18px; font-weight: 600; color: #333333; font-family: -apple-system, sans-serif; }

  /* --- 降级 UI 样式 --- */
  .fallback-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 4px 0;
  }
  
  .fallback-msg {
    font-size: 12px;
    color: #666;
  }

  .fallback-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }

  .gps-btn {
    background-color: #f0f0f2;
    color: #333;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .or-text {
    font-size: 12px;
    color: #999;
  }

  .search-box {
    display: flex;
    background: #f9f9fb;
    border-radius: 6px;
    border: 1px solid #eee;
    overflow: hidden;
  }

  .search-box input {
    border: none;
    background: transparent;
    padding: 4px 8px;
    font-size: 12px;
    width: 70px;
    outline: none;
    color: #333;
  }

  .search-btn {
    background: #007aff;
    color: #fff;
    border: none;
    padding: 0 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .loading-panel {
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: #999;
    padding: 10px 0;
  }
</style>