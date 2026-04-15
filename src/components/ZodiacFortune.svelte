<script>
  // 接收从 App.svelte 传来的全局选定日期
  let { selectedDate } = $props();

  // 1. 星座计算核心逻辑 (纯原生，无依赖)
  function getZodiacInfo(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    
    if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return { name: '白羊座', icon: '♈', element: '火象' };
    if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return { name: '金牛座', icon: '♉', element: '土象' };
    if ((m == 5 && d >= 21) || (m == 6 && d <= 21)) return { name: '双子座', icon: '♊', element: '风象' };
    if ((m == 6 && d >= 22) || (m == 7 && d <= 22)) return { name: '巨蟹座', icon: '♋', element: '水象' };
    if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return { name: '狮子座', icon: '♌', element: '火象' };
    if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return { name: '处女座', icon: '♍', element: '土象' };
    if ((m == 9 && d >= 23) || (m == 10 && d <= 23)) return { name: '天秤座', icon: '♎', element: '风象' };
    if ((m == 10 && d >= 24) || (m == 11 && d <= 22)) return { name: '天蝎座', icon: '♏', element: '水象' };
    if ((m == 11 && d >= 23) || (m == 12 && d <= 21)) return { name: '射手座', icon: '♐', element: '火象' };
    if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return { name: '摩羯座', icon: '♑', element: '土象' };
    if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return { name: '水瓶座', icon: '♒', element: '风象' };
    return { name: '双鱼座', icon: '♓', element: '水象' };
  }

  // 2. 模拟运势接口 (用日期和星座名字生成伪随机数据)
  function fetchMockFortune(date, zodiacName) {
    // 简单的伪随机算法，保证同一天同一个星座运势固定
    const seed = date.getDate() + date.getMonth() + zodiacName.charCodeAt(0);
    const score = (seed % 5) + 1; // 生成 1 到 5 的评分
    
    const messages = [
      "今日宜静不宜动，保持平常心。",
      "有意外的惊喜，适合去尝试新鲜事物。",
      "工作/学习效率极高，抓住灵感闪现的瞬间。",
      "沟通可能会有些障碍，注意表达方式。",
      "财运不错，但要注意控制冲动消费。"
    ];
    const msgIndex = seed % messages.length;

    return {
      stars: score,
      color: '#ffa600', // 星星的颜色
      message: messages[msgIndex],
      luckyNumber: (seed % 9) + 1
    };
  }

  // 3. 使用 $derived 让数据根据 selectedDate 自动更新
  let zodiac = $derived(getZodiacInfo(selectedDate));
  let fortune = $derived(fetchMockFortune(selectedDate, zodiac.name));

  // 辅助函数：渲染星星
  function renderStars(count) {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }
</script>

<div class="zodiac-fortune-card">
  <div class="zodiac-section">
    <div class="icon">{zodiac.icon}</div>
    <div class="name">{zodiac.name}</div>
    <div class="tag">{zodiac.element}</div>
  </div>

  <div class="divider"></div>

  <div class="fortune-section">
    <div class="fortune-header">
      <span class="label">今日运势</span>
      <span class="stars" style="color: {fortune.color}">{renderStars(fortune.stars)}</span>
    </div>
    <div class="message">
      {fortune.message}
    </div>
    <div class="lucky-tips">
      幸运数字：<span>{fortune.luckyNumber}</span>
    </div>
  </div>
</div>

<style>
  .zodiac-fortune-card {
    display: flex;
    background-color: #ffffff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
  }

  /* 左侧星座区块 */
  .zodiac-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }

  .zodiac-section .icon {
    font-size: 32px;
    line-height: 1;
    margin-bottom: 4px;
  }

  .zodiac-section .name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  .zodiac-section .tag {
    font-size: 11px;
    color: #888;
    background-color: #f5f5f7;
    padding: 2px 8px;
    border-radius: 10px;
    margin-top: 4px;
  }

  /* 分割线 */
  .divider {
    width: 1px;
    background-color: #f0f0f0;
    margin: 0 16px;
  }

  /* 右侧运势区块 */
  .fortune-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .fortune-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .fortune-header .label {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .fortune-header .stars {
    font-size: 14px;
    letter-spacing: 2px;
  }

  .message {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
  }

  .lucky-tips {
    font-size: 12px;
    color: #999;
  }

  .lucky-tips span {
    color: #ff3b30;
    font-weight: bold;
    margin-left: 4px;
  }
</style>