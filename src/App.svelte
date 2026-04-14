<script>
  import { onMount } from 'svelte';
  import { Solar } from 'lunar-javascript';

  // --- 1. 基础状态 ---
  let today = new Date();
  let displayYear = today.getFullYear();
  let displayMonth = today.getMonth();
  
  let selectedDateStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  let isOffline = !navigator.onLine;

  // 天气状态（默认使用占位符，避免初始白屏）
 let weatherData = {
    city: '本地', // 默认显示本地
    today: { temp: '--°C', text: '获取中' },
    tomorrow: { temp: '--°C', text: '获取中' }
  };

  onMount(() => {
    // 初始化网络监听
    window.addEventListener('online', () => { isOffline = false; fetchWeather(); });
    window.addEventListener('offline', () => isOffline = true);
    
    // 页面加载时立刻获取天气
    fetchWeather();
  });

  // 工具函数：格式化日期
  function formatDate(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // --- 增加：天气 API 配置信息 ---
  const WEATHER_CONFIG = {
    key: '5df67e2177e54f68a68cb5c08179dda9',     // TODO: 替换为你申请的和风天气 API Key
    location: '101280601',   // 默认北京。你可以替换为你所在城市的 Location ID，或直接填入经纬度(如 "116.41,39.92")
    cityName: '深圳'         // 手动绑定该 ID 对应的城市名，用于界面展示
  };

 /**
  * // https://mx6vhghb2n.re.qweatherapi.com/v7/weather/now?location=101280601&key=5df67e2177e54f68a68cb5c08179dda9
  * now接口修改
  * // 假设你的接口已经是 https://devapi.qweather.com/v7/weather/now
      if (data.code === '200') {
        weatherData = {
          city: WEATHER_CONFIG.cityName,
          // 直接读取 data.now 里的 temp 和 text
          today: { temp: `${data.now.temp}°C`, text: data.now.text },
          tomorrow: { temp: '--°C', text: '暂无' } // 实时接口没有明天的数据
        };
        localStorage.setItem('pwa_weather_cache', JSON.stringify(weatherData));
      }
  */
  
  // --- 增加：构造 API 地址的工具函数 ---
  function buildWeatherUrl(location, key) {
    // 3天预告
    const baseUrl = 'https://mx6vhghb2n.re.qweatherapi.com/v7/weather/3d';
    // 你可以在这里自由添加其他固定参数，比如 lang=zh (中文)
    return `${baseUrl}?location=${location}&key=${key}`;
  }

  // --- 2. 天气获取与缓存逻辑 ---
  async function fetchWeather() {
    // 1. 无延迟读取本地缓存
    const cachedWeather = localStorage.getItem('pwa_weather_cache');
    if (cachedWeather) {
      weatherData = JSON.parse(cachedWeather);
    }

    // 2. 如果断网，直接使用缓存，终止请求
    if (isOffline) return;

    // 3. 发送真实网络请求
    try {
      const url = buildWeatherUrl(WEATHER_CONFIG.location, WEATHER_CONFIG.key);
      const res = await fetch(url);
      const data = await res.json();

      // 和风天气 API 返回的成功状态码是字符串 '200'
      if (data.code === '200') {
        weatherData = {
          city: WEATHER_CONFIG.cityName,
          // data.daily[0] 是今天，data.daily[1] 是明天
          today: { temp: `${data.daily[0].tempMax}°C`, text: data.daily[0].textDay },
          tomorrow: { temp: `${data.daily[1].tempMax}°C`, text: data.daily[1].textDay }
        };
        // 数据写入缓存
        localStorage.setItem('pwa_weather_cache', JSON.stringify(weatherData));
        console.log("天启数据获取成功.");
      } else {
        console.error("天气数据获取异常，API 状态码:", data.code);
      }
    } catch (error) {
      console.error("天气数据同步失败:", error);
    }
  }

  
  // --- 3. 年月切换逻辑 ---
  function prevMonth() {
    if (displayMonth === 0) { displayMonth = 11; displayYear -= 1; } 
    else { displayMonth -= 1; }
    selectedDateStr = formatDate(displayYear, displayMonth + 1, 1);
  }

  function nextMonth() {
    if (displayMonth === 11) { displayMonth = 0; displayYear += 1; } 
    else { displayMonth += 1; }
    selectedDateStr = formatDate(displayYear, displayMonth + 1, 1);
  }

  function goToday() {
    displayYear = today.getFullYear();
    displayMonth = today.getMonth();
    selectedDateStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }

  // --- 4. 日历网格生成 ---
  $: days = generateCalendar(displayYear, displayMonth);

  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    let calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push({ empty: true });
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = formatDate(year, month + 1, i);
      const isToday = dateStr === todayStr;
      
      const lunar = Solar.fromYmd(year, month + 1, i).getLunar();
      const rawLunarText = lunar.getDayInChinese();
      
      // 逻辑优化：如果是今天，直接显示“今天”；如果是初一，显示“X月”
      let finalText = rawLunarText;
      if (isToday) {
        finalText = '今天';
      } else if (rawLunarText === '初一') {
        finalText = `${lunar.getMonthInChinese()}月`;
      }

      calendarDays.push({ 
        empty: false, 
        day: i, 
        dateStr: dateStr,
        lunarText: finalText,
        isToday: isToday
      });
    }
    return calendarDays;
  }

  // --- 5. 真实黄历数据获取 ---
  $: lunarInfo = getRealLunarData(selectedDateStr);

  function getRealLunarData(dateStr) {
    if (!dateStr) return { yi: [], ji: [], lunarDate: '' };
    const [y, m, d] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    
    return {
      yi: lunar.getDayYi(),
      ji: lunar.getDayJi(),
      lunarDate: `农历 ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
    };
  }

  function selectDate(dateStr) {
    if (dateStr) selectedDateStr = dateStr;
  }
</script>

<main class="app-container">
  <header class="weather-card">
    <div class="status-bar">
      <span>{weatherData.city}气象</span>
      <span class="network-status" class:offline={isOffline}>
        {isOffline ? '离线' : '在线'}
      </span>
    </div>
    <div class="weather-info">
      <div class="weather-item">
        <span class="label">今日</span>
        <span class="temp">{weatherData.today.text} {weatherData.today.temp}</span>
      </div>
      <div class="divider"></div>
      <div class="weather-item">
        <span class="label">明日</span>
        <span class="temp">{weatherData.tomorrow.text} {weatherData.tomorrow.temp}</span>
      </div>
    </div>
  </header>

  <section class="calendar-card">
    <div class="month-controller">
      <button class="icon-btn" on:click={prevMonth}>◀</button>
      <button class="current-month" on:click={goToday}>
        {displayYear}年 {displayMonth + 1}月
      </button>
      <button class="icon-btn" on:click={nextMonth}>▶</button>
    </div>

    <div class="weekdays">
      <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
    </div>
    <div class="days-grid">
      {#each days as dayObj}
        <button 
          class="day-btn" 
          class:empty={dayObj.empty}
          class:selected={dayObj.dateStr === selectedDateStr}
          class:is-today={dayObj.isToday}
          on:click={() => selectDate(dayObj.dateStr)}
          disabled={dayObj.empty}
        >
          {#if !dayObj.empty}
            <span class="num">{dayObj.day}</span>
            <span class="lunar-num">{dayObj.lunarText}</span>
          {/if}
        </button>
      {/each}
    </div>
  </section>

  <section class="lunar-card">
    <div class="date-header">
      <span class="solar-date">{selectedDateStr}</span>
      <span class="lunar-date">{lunarInfo.lunarDate}</span>
    </div>
    
    <div class="lunar-row yi">
      <span class="tag">宜</span>
      <div class="items">
        {#each lunarInfo.yi as item} <span>{item}</span> {/each}
        {#if lunarInfo.yi.length === 0} <span>诸事不宜</span> {/if}
      </div>
    </div>
    
    <div class="lunar-row ji">
      <span class="tag">忌</span>
      <div class="items">
        {#each lunarInfo.ji as item} <span>{item}</span> {/each}
        {#if lunarInfo.ji.length === 0} <span>百无禁忌</span> {/if}
      </div>
    </div>
  </section>
</main>

<style>
  /* 基础骨架 */
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f5f5f7; color: #333; -webkit-tap-highlight-color: transparent; }
  .app-container { width: 100%; max-width: 480px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; height: 100vh; box-sizing: border-box; }
  header, section { width: 100%; box-sizing: border-box; background: white; border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

  /* 天气 */
  .status-bar { display: flex; justify-content: space-between; font-size: 14px; color: #666; margin-bottom: 12px; }
  .network-status { color: #34c759; } .network-status.offline { color: #ff3b30; }
  .weather-info { display: flex; justify-content: space-between; align-items: center; }
  .weather-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
  .weather-item .label { font-size: 12px; color: #888; } .weather-item .temp { font-size: 18px; font-weight: bold; margin-top: 4px; }
  .divider { width: 1px; height: 30px; background: #eee; }

  /* 日历控制区 */
  .month-controller { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 18px; font-weight: bold; }
  .icon-btn { background: none; border: none; font-size: 16px; color: #007aff; cursor: pointer; padding: 4px 12px; border-radius: 8px; }
  .icon-btn:active { background: #f0f0f0; }
  .current-month { cursor: pointer; 
    background: none; 
    border: none; 
    font-size: inherit; 
    font-weight: inherit; 
    color: inherit; 
    padding: 0;
    font-family: inherit;} 

  /* 网格 */
 /* ------ 替换这一段网格样式 ------ */
  .weekdays { 
    display: grid; grid-template-columns: repeat(7, 1fr); 
    text-align: center; font-size: 13px; font-weight: bold; color: #888; margin-bottom: 12px; 
  }
  .days-grid { 
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; /* 增加每天之间的间距 */
  }
  
  .day-btn { 
    border: none; 
    height: 52px; /* 增加高度 */
    border-radius: 10px; 
    display: flex; flex-direction: column; align-items: center; justify-content: center; 
    cursor: pointer; transition: all 0.2s; padding: 0;
    /* 给所有日历方块加上默认的实体背景和微投影，让它们看起来像独立的按钮 */
    background-color: #fafafa; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #f0f0f0;
  }
  .day-btn.empty { 
    cursor: default; background: transparent; box-shadow: none; border: none; 
  }
  .day-btn:active:not(.empty) { transform: scale(0.92); }
  
  /* 强化阳历数字的视觉层级 */
  .num { font-size: 18px; font-weight: 600; color: #222; line-height: 1.1; }
  .lunar-num { font-size: 11px; color: #888; line-height: 1; margin-top: 4px; }
  
  /* 当天的高亮显示策略 */
  .day-btn.is-today .num { color: #007aff; }
  .day-btn.is-today .lunar-num { color: #007aff; font-weight: bold; }

  /* 选中状态的绝对高亮（覆盖原有颜色） */
  .day-btn.selected { 
    background-color: #007aff; 
    border-color: #007aff;
    box-shadow: 0 4px 10px rgba(0,122,255,0.3); 
  }
  .day-btn.selected .num, .day-btn.selected .lunar-num { color: white; }
  /* ------------------------------ */

  /* 宜忌 */
  .date-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  .solar-date { font-weight: bold; font-size: 18px; }
  .lunar-date { font-size: 14px; color: #666; }
  
  .lunar-row { display: flex; margin-bottom: 12px; align-items: flex-start; }
  .lunar-row:last-child { margin-bottom: 0; }
  
  .tag { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: white; margin-right: 12px; flex-shrink: 0; }
  .yi .tag { background-color: #34c759; }
  .ji .tag { background-color: #ff3b30; }

  .items { display: flex; flex-wrap: wrap; gap: 8px; }
  .items span { font-size: 14px; background: #f5f5f7; padding: 4px 8px; border-radius: 4px; }
</style>