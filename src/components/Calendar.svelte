<script>
    import { Lunar } from 'lunar-javascript';

  let { currentDate = $bindable(new Date()), onAddTask } = $props();

  let viewMode = $state('week'); 
  let displayDate = $state(new Date()); 

  // --- 新增：节假日数据加载逻辑 ---
  let holidayMap = $state({}); // 存储已加载的节假日，格式为 {'YYYY-MM-DD': { name: '元旦', isOff: true }}

  // 按需加载对应年份的 JSON 数据
  async function loadYearlyHolidays(year) {
    // 如果已经加载过该年的数据（以1月1日为探测点），则直接跳过，防止重复请求
    if (holidayMap[`${year}-01-01`] !== undefined) return;

    try {
      // 通过 CDN 直接读取 github 仓库同步的发布版本数据
      const url = `https://cdn.jsdelivr.net/npm/holiday-calendar@latest/data/CN/${year}.json`;
      const response = await fetch(url);
      if (!response.ok) return;
      
      const data = await response.json();
      const newMap = { ...holidayMap };

      // 解析 JSON 结构：将数组转化为便于快速查找的字典格式
      data.dates.forEach(item => {
        newMap[item.date] = {
          name: item.name_cn, // 节日名称，如 "国庆节"
          isOff: item.type === 'public_holiday' // true 为放假 (休)，false 为补班 (班)
        };
      });

      holidayMap = newMap;
    } catch (error) {
      console.error('节假日数据加载失败:', error);
    }
  }

  // 监听当前显示的年份，一旦改变就去加载当年数据
  $effect(() => {
    loadYearlyHolidays(displayDate.getFullYear());
  });

  // 获取具体某一天的节假日信息
  function getHolidayInfo(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return holidayMap[dateStr] || null;
  }
  // ------------------------------

  let startX = 0;
  let startY = 0; // 新增：记录起始 Y 坐标
  let isSwiping = false; // 新增：用于判断用户当前是点击还是滑动
  const SWIPE_THRESHOLD = 30; // 适当降低阈值提高灵敏度

  function handlePointerDown(e) {
    e.target.releasePointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    isSwiping = false; // 每次按下时，重置滑动状态
    
    // 阻止某些浏览器的默认拖拽行为，确保事件顺畅
    if (e.pointerType === 'mouse') {
      // 电脑端可以不阻止，或者根据需要设置
    }
  }

  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY; // 计算 Y 轴位移

    // 判定条件1：横向位移大于纵向位移 -> 左右切换月份/周
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      isSwiping = true; // 触发了横向滑动，打上标记
      if (deltaX > 0) prev();
      else next();
    } 
    else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      isSwiping = true; // 触发了纵向滑动，打上标记
      if (deltaY < 0 && viewMode === 'month') {
        setViewMode('week');
      } else if (deltaY > 0 && viewMode === 'week') {
        setViewMode('month');
      }
    }
  }

  // 新增：安全触发日期的包装函数
  function handleDateClick(date) {
    // 只有当用户没有在滑动时，才执行选中逻辑
    if (!isSwiping) {
      selectDate(date);
    }
  }


  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();



  // 核心网格数据生成逻辑保持不变
  let calendarDays = $derived.by(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const days = [];

    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();

      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    } else {
      const currentDayOfWeek = displayDate.getDay();
      const startOfWeek = new Date(displayDate);
      startOfWeek.setDate(displayDate.getDate() - currentDayOfWeek);

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push({ date: d, isCurrentMonth: d.getMonth() === month });
      }
    }
    return days;
  });

  let showTodayBtn = $derived(!calendarDays.some(d => d.date.toDateString() === today.toDateString()));

  // --- 预留的农历与节假日接口 ---

  // 模拟获取农历：后续可替换为 lunar-javascript 的解析逻辑或 API 数据
//   function getLunarText(date) {
//     // 这里做个简单的假数据展示：每月初一显示特殊字，其他显示日期
//     const d = date.getDate();
//     return d === 1 ? '初一' : `廿${(d % 10) || 10}`; 
//   }
    function getLunarText(date) {
    // 调用真实的农历库解析当前日期
    const lunar = Lunar.fromDate(date);
    const lunarDay = lunar.getDayInChinese();
    
    // 如果是初一，可以返回月份，比如 "四月"；否则返回 "廿二" 这种日子
    return lunarDay === '初一' ? lunar.getMonthInChinese() + '月' : lunarDay;
  }


  // 模拟获取节假日：后续可替换为节假日 API 逻辑
  function getHoliday(date) {
    // 假数据：假设每个月的 15 号都是特殊节日
    if (date.getDate() === 15) return '特殊日';
    return null;
  }

  // --- 交互方法 ---

  function prev() {
    const d = new Date(displayDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    displayDate = d;
  }

  function next() {
    const d = new Date(displayDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    displayDate = d;
  }

  function goToday() {
    displayDate = new Date();
    currentDate = new Date();
  }

  function selectDate(d) {
    currentDate = d;
    if (d.getMonth() !== displayDate.getMonth()) {
      displayDate = new Date(d);
    }
  }

  // 修改为直接设置模式，而不是 Toggle
  function setViewMode(mode) {
    viewMode = mode;
    displayDate = new Date(currentDate); 
  }
</script>

<div class="calendar-container">
  <div class="header">
    <div class="month-selector">
      <button class="arrow-btn" onclick={prev}>&lt;</button>
      <span class="date-title">{displayDate.getFullYear()}年 {displayDate.getMonth() + 1}月</span>
      <button class="arrow-btn" onclick={next}>&gt;</button>

      <button class="header-add-btn" onclick={onAddTask}>＋</button>
    </div>
    
    <div class="actions">
      {#if showTodayBtn}
        <button class="today-btn" onclick={goToday}>今</button>
      {/if}
      
      <div class="segment-control">
        <button 
          class:active={viewMode === 'week'} 
          onclick={() => setViewMode('week')}
        >周</button>
        <button 
          class:active={viewMode === 'month'} 
          onclick={() => setViewMode('month')}
        >月</button>
      </div>
    </div>
  </div>

  <div class="weekdays">
    {#each weekDays as day}
      <div class="weekday">{day}</div>
    {/each}
  </div>

 <div 
    class="days-grid" 
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    style="touch-action: none; user-select: none; -webkit-user-select: none;"
  >
    {#each calendarDays as { date, isCurrentMonth }}
      {@const holidayInfo = getHolidayInfo(date)}
      
      <div 
        class="day-cell"
        class:not-current={!isCurrentMonth}
        class:selected={date.toDateString() === currentDate.toDateString()}
        class:is-today={date.toDateString() === today.toDateString()}
        onclick={() => handleDateClick(date)}
      >
        {#if holidayInfo}
          <span class="corner-mark" class:is-work={!holidayInfo.isOff}>
            {holidayInfo.isOff ? '休' : '班'}
          </span>
        {/if}

        <span class="day-number">{date.getDate()}</span>
        
        <span class="lunar-text" class:is-holiday={holidayInfo?.isOff}>
          {holidayInfo?.name || getLunarText(date)}
        </span>
      </div>
    {/each}
  </div>

</div>

<style>
  .calendar-container {
    background-color: #ffffff;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    /* 新增：防止拖拽日历时意外选中日期数字或文字 */
    user-select: none; 
    -webkit-user-select: none; /* 兼容 Safari */
    
    /* 确保指针事件顺畅 */
    touch-action: pan-y;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .month-selector {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .date-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    min-width: 85px;
    text-align: center;
  }

  .arrow-btn {
    background: none;
    border: none;
    font-size: 16px;
    color: #666;
    cursor: pointer;
    padding: 4px;
  }

  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .today-btn {
    background-color: #ffe5e5;
    color: #ff3b30;
    border: none;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
  }

  /* 分段控制器样式 */
  .segment-control {
    display: flex;
    background-color: #f0f0f2;
    border-radius: 6px;
    padding: 2px;
  }

  .segment-control button {
    background: transparent;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
  }

  /* 选中的按钮样式变深，加点阴影看起来像按下去了一样 */
  .segment-control button.active {
    background-color: #ffffff;
    color: #333;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8px;
  }

  .weekday {
    text-align: center;
    font-size: 12px;
    color: #999;
    font-weight: 500;
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px 0;
    /* 重要：禁止浏览器默认的横向滚动行为，确保我们的 JS 逻辑接管手势 */
    touch-action: pan-y; 
    /* 增加平滑过渡的视觉反馈（可选） */
    transition: transform 0.2s ease-out;
  }

  /* 调整了高度以容纳农历文字 */
  .day-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 52px; 
    padding-top: 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .day-number {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }

  /* 农历和节假日文字样式 */
  .lunar-text {
    font-size: 10px;
    color: #999;
    margin-top: 2px;
    transform: scale(0.9); /* 让文字稍微再小一点，显得精致 */
  }

  /* 如果是节假日，文字变红高亮 */
  .lunar-text.is-holiday {
    color: #ff3b30;
  }

  /* 节假日角标通用样式 */
  .corner-mark {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    transform: scale(0.85); /* 用缩放让文字比 12px 更小，显得精致 */
    transform-origin: top right;
    color: #ff3b30; /* 默认放假为红色字 */
  }

  /* 补班的角标样式 */
  .corner-mark.is-work {
    color: #666666; /* 补班显示为灰色 */
  }

  .day-cell.not-current .day-number,
  .day-cell.not-current .lunar-text {
    color: #cccccc;
  }

  .day-cell.is-today .day-number {
    color: #ff3b30;
    font-weight: bold;
  }

  .day-cell.selected {
    background-color: #f5f5f7;
  }

  .day-cell.selected .day-number {
    background-color: #333;
    color: #fff;
  }

  .day-cell.selected.is-today .day-number {
    background-color: #ff3b30;
    color: #fff;
  }

  .header-add-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: #f0f0f2;
    border: none;
    color: #333;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px; /* 紧跟右箭头 */
    cursor: pointer;
    transition: background 0.2s;
  }
  .header-add-btn:active {
    background-color: #e0e0e0;
  }
</style>