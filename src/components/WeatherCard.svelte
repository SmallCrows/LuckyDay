<script>
  import { onMount } from 'svelte';

  // --- 配置区域 ---
  // 请将这里的参数替换为你之前申请好的和风天气真实数据
  const QWEATHER_KEY = '5df67e2177e54f68a68cb5c08179dda9'; 
  const LOCATION = '101330101'; // 你的城市代码（例如北京是 101010100，或传入经纬度）
  
  // 气象数据状态模型（默认显示占位符）
  let weather = $state({
    today: { text: '--', temp: '--°C', humidity: '--%', uv: '--', icon: '⛅' },
    tomorrow: { text: '--', temp: '--°C', humidity: '--%', uv: '--', icon: '☁️' }
  });

  // 和风天气图标代码与 Emoji 的简单映射 (你可以根据需要替换为真实的 SVG 图标)
  function getWeatherEmoji(iconCode) {
    const map = {
      '100': '☀️', '101': '⛅', '104': '☁️', '300': '🌧️', '305': '🌦️', 
      '400': '🌨️', '404': '🌨️', '501': '🌫️', '302': '⛈️'
    };
    return map[iconCode] || '🌤️';
  }

  // 简单的紫外线指数文字转换
  function getUVText(index) {
    const uv = parseInt(index);
    if (uv <= 2) return '最弱';
    if (uv <= 4) return '弱';
    if (uv <= 6) return '中等';
    if (uv <= 9) return '强';
    return '极强';
  }

  async function fetchWeather() {
    const cacheKey = `weather_cache_${LOCATION}`;
    const now = Date.now();

    // 1. 尝试读取本地缓存
    const cachedString = localStorage.getItem(cacheKey);
    if (cachedString) {
      const cacheData = JSON.parse(cachedString);
      // 如果缓存未过期（这里设置 1 小时 = 3600000 毫秒），直接使用缓存数据
      if (now - cacheData.timestamp < 3600000) {
        weather.today = cacheData.today;
        weather.tomorrow = cacheData.tomorrow;
        return;
      }
    }

    // 2. 缓存过期或不存在，发起真实网络请求
    try {
      // 使用 3 天预报接口，可以同时拿到今天和明天的数据，且包含湿度和紫外线
      const url = `https://mx6vhghb2n.re.qweatherapi.com/v7/weather/3d?location=${LOCATION}&key=${QWEATHER_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === '200' && data.daily) {
        const todayData = data.daily[0];
        const tomorrowData = data.daily[1];

        // 更新状态变量
        weather.today = {
          text: todayData.textDay,
          temp: `${todayData.tempMax}°C`, // 取最高温作为展示
          humidity: `${todayData.humidity}%`,
          uv: getUVText(todayData.uvIndex),
          icon: getWeatherEmoji(todayData.iconDay)
        };

        weather.tomorrow = {
          text: tomorrowData.textDay,
          temp: `${tomorrowData.tempMax}°C`,
          humidity: `${tomorrowData.humidity}%`,
          uv: getUVText(tomorrowData.uvIndex),
          icon: getWeatherEmoji(tomorrowData.iconDay)
        };

        // 保存到缓存
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: now,
          today: weather.today,
          tomorrow: weather.tomorrow
        }));
      } else {
        console.error('和风接口返回异常:', data);
      }
    } catch (error) {
      console.error('获取天气失败:', error);
    }
  }

  // 组件挂载时触发请求
  $effect(() => {
    // 只有在 QWEATHER_KEY 被替换为真实 key 时才发起请求，避免报错
    if (QWEATHER_KEY !== '你的和风天气API_KEY') {
      fetchWeather();
    }
  });
</script>

<div class="weather-card">
  <div class="day-panel">
    <div class="header">今日</div>
    <div class="main-display">
      <span class="icon">{weather.today.icon}</span>
      <div class="info">
        <div class="text-temp">{weather.today.text} <span class="temp">{weather.today.temp}</span></div>
      </div>
    </div>
    <div class="details">
      <span>湿度 {weather.today.humidity}</span>
      <span class="dot">·</span>
      <span>辐射 {weather.today.uv}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="day-panel tomorrow">
    <div class="header">明日</div>
    <div class="main-display">
      <span class="icon">{weather.tomorrow.icon}</span>
      <div class="info">
        <div class="text-temp">{weather.tomorrow.text} <span class="temp">{weather.tomorrow.temp}</span></div>
      </div>
    </div>
    <div class="details">
      <span>湿度 {weather.tomorrow.humidity}</span>
      <span class="dot">·</span>
      <span>辐射 {weather.tomorrow.uv}</span>
    </div>
  </div>
</div>

<style>
  .weather-card {
    display: flex;
    margin: 10px 16px;
    padding: 16px;
    background-color: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
  }

  .day-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .day-panel.tomorrow {
    opacity: 0.85;
  }

  .divider {
    width: 1px;
    background-color: #f0f0f0;
    margin: 0 16px;
  }

  .header {
    font-size: 13px;
    color: #888888;
    font-weight: 500;
  }

  .main-display {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    font-size: 28px;
  }

  .text-temp {
    font-size: 18px;
    font-weight: 600;
    color: #333333;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .temp {
    font-size: 22px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .details {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #666666;
  }

  .dot {
    margin: 0 6px;
    color: #cccccc;
  }
</style>