<script>
    import { Lunar } from 'lunar-javascript';

  let { currentDate = $bindable(new Date()) } = $props();

  let viewMode = $state('week'); 
  let displayDate = $state(new Date()); 
 
let startX = 0;
  const SWIPE_THRESHOLD = 50; // 触发滑动的最小位移（像素）

function handlePointerDown(e) {
    // clientX 直接存在于事件对象上，不需要找 touches 数组
    startX = e.clientX; 
  }

 function handlePointerUp(e) {
    const endX = e.clientX;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // 向右滑 -> 上一周/月
        prev();
      } else {
        // 向左滑 -> 下一周/月
        next();
      }
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
  >
    {#each calendarDays as { date, isCurrentMonth }}
      <div 
        class="day-cell"
        class:not-current={!isCurrentMonth}
        class:selected={date.toDateString() === currentDate.toDateString()}
        class:is-today={date.toDateString() === today.toDateString()}
        onclick={() => selectDate(date)}
      >
        <span class="day-number">{date.getDate()}</span>
        <span class="lunar-text" class:is-holiday={getHoliday(date)}>
          {getHoliday(date) || getLunarText(date)}
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
</style>