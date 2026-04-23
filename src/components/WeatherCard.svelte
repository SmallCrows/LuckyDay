<script>
  // --- 配置区域 ---
  const QWEATHER_KEY = '5df67e2177e54f68a68cb5c08179dda9'; 
  
  // 气象数据状态模型（新增 city 字段）
  let weather = $state({
    city: '定位中',
    today: { text: '--', temp: '--°C', humidity: '--%', uv: '--', icon: '⛅' },
    tomorrow: { text: '--', temp: '--°C', humidity: '--%', uv: '--', icon: '☁️' }
  });

  function getWeatherEmoji(iconCode) {
    const map = {
      '100': '☀️', '101': '⛅', '104': '☁️', '300': '🌧️', '305': '🌦️', 
      '400': '🌨️', '404': '🌨️', '501': '🌫️', '302': '⛈️'
    };
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

  async function fetchWeather() {
    const cacheKey = 'weather_auto_cache';
    const now = Date.now();

    // 读取本地缓存
    const cachedString = localStorage.getItem(cacheKey);
    if (cachedString) {
      const cacheData = JSON.parse(cachedString);
      if (now - cacheData.timestamp < 3600000) {
        weather = cacheData.data;
        return;
      }
    }

    try {
      // 1. 获取当前设备的公网 IP
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipRes.json();

      // 2. 调用和风 GeoAPI 解析 IP 对应的城市代码
      //const geoRes = await fetch(`https://geoapi.qweather.com/v2/city/lookup?location=${ip}&key=${QWEATHER_KEY}`);
      const geoRes = await fetch(`https://mx6vhghb2n.re.qweatherapi.com/geo/v2/city/lookup?location=${ip}&key=${QWEATHER_KEY}`);
      const geoData = await geoRes.json();
      
      if (geoData.code !== '200' || !geoData.location || geoData.location.length === 0) {
        weather.city = '定位失败';
        return;
      }
      
      const locNode = geoData.location[0];
      const locationId = locNode.id;
      const cityName = locNode.name; // 获取解析到的城市/区县名

      // 3. 使用解析出的代码拉取天气数据
      const weatherRes = await fetch(`https://mx6vhghb2n.re.qweatherapi.com/v7/weather/3d?location=${locationId}&key=${QWEATHER_KEY}`);
      const weatherData = await weatherRes.json();

      if (weatherData.code === '200' && weatherData.daily) {
        const t0 = weatherData.daily[0];
        const t1 = weatherData.daily[1];

        // 批量更新状态
        weather = {
          city: cityName,
          today: {
            text: t0.textDay,
            temp: `${t0.tempMax}°C`,
            humidity: `${t0.humidity}%`,
            uv: getUVText(t0.uvIndex),
            icon: getWeatherEmoji(t0.iconDay)
          },
          tomorrow: {
            text: t1.textDay,
            temp: `${t1.tempMax}°C`,
            humidity: `${t1.humidity}%`,
            uv: getUVText(t1.uvIndex),
            icon: getWeatherEmoji(t1.iconDay)
          }
        };

        // 存入缓存
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: now,
          data: weather
        }));
      }
    } catch (error) {
      console.error('获取天气或定位失败:', error);
      if (weather.city === '定位中') weather.city = '网络异常';
    }
  }

  $effect(() => {
    if (QWEATHER_KEY !== '你的和风天气API_KEY') {
      fetchWeather();
    }
  });
</script>

<div class="weather-card">
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
  }

  .day-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .day-panel.tomorrow {
    opacity: 0.85;
  }

  .divider {
    width: 1px;
    background-color: #f0f0f0;
    margin: 0 12px;
  }

  .header-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }

  .day-title {
    font-size: 12px;
    color: #888888;
    font-weight: 500;
  }

  .details {
    flex: 1; 
    text-align: center; 
    font-size: 10px; 
    color: #888888;
  }

  .main-row {
    display: flex;
    align-items: center; 
    gap: 8px; 
  }

  .icon {
    font-size: 22px; 
    line-height: 1;
  }

  .text {
    font-size: 14px;
    font-weight: 500;
    color: #555555;
  }

  .temp {
    font-size: 18px;
    font-weight: 600;
    color: #333333;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
</style>