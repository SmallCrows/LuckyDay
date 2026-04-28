<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { slide, fade } from 'svelte/transition';

  let { selectedDate, showForm = $bindable(false) } = $props();
  
  let events = $state([]);
  let newTaskContent = $state('');
  let isImportant = $state(false);
  let isUrgent = $state(false);

  let pendingToggles = $state({}); 
  let toggleTimeouts = {}; 

  // --- 新增：滑动删除的核心状态与逻辑 ---
  let swipeStates = $state({}); // 记录每条事件当前的偏移量 { id: { x: 0, sliding: false } }
  let startX = 0;
  let startY = 0;
  let activePointerId = null;
  let isSwiping = false;

  onMount(() => {
    const saved = localStorage.getItem('lucky_day_events');
    if (saved) events = JSON.parse(saved);
  });

  $effect(() => {
    localStorage.setItem('lucky_day_events', JSON.stringify(events));
  });

  let dailyEvents = $derived.by(() => {
    const dateStr = selectedDate.toDateString();
    let filtered = events.filter(e => e.date === dateStr);

    filtered.sort((a, b) => {
      const aCompleted = !!a.isCompleted;
      const bCompleted = !!b.isCompleted;
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      const getScore = (e) => {
        if (e.isImportant && e.isUrgent) return 3;     
        if (e.isImportant && !e.isUrgent) return 2;    
        if (!e.isImportant && e.isUrgent) return 1;    
        return 0;                                      
      };
      return getScore(b) - getScore(a);
    });

    return filtered;
  });

  function addEvent() {
    if (!newTaskContent.trim()) return;
    const newEvent = {
      id: crypto.randomUUID(),
      date: selectedDate.toDateString(),
      content: newTaskContent.trim(),
      isImportant,
      isUrgent,
      isCompleted: false 
    };
    
    events = [newEvent, ...events];
    newTaskContent = '';
    isImportant = false;
    isUrgent = false;
    showForm = false;
  }

  function deleteEvent(id) {
    events = events.filter(e => e.id !== id);
  }

  function toggleCompletion(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    if (toggleTimeouts[id]) clearTimeout(toggleTimeouts[id]);
    const currentVisual = pendingToggles[id] !== undefined ? pendingToggles[id] : event.isCompleted;
    const nextVisual = !currentVisual;

    pendingToggles[id] = nextVisual;
    toggleTimeouts[id] = setTimeout(() => {
      events = events.map(e => e.id === id ? { ...e, isCompleted: nextVisual } : e);
      delete pendingToggles[id];
      delete toggleTimeouts[id];
    }, 600);
  }

  function getPriorityClass(imp, urg) {
    if (imp && urg) return 'p0';
    if (imp && !urg) return 'p1';
    if (!imp && urg) return 'p2';
    return 'p3';
  }

  // --- 滑动交互事件监听 ---
  function onPointerDown(e, id) {
    startX = e.clientX;
    startY = e.clientY;
    activePointerId = e.pointerId;
    isSwiping = true;
    e.currentTarget.setPointerCapture(e.pointerId); // 锁定焦点
    swipeStates[id] = { x: 0, sliding: true };
  }

  function onPointerMove(e, id) {
    if (!isSwiping || activePointerId !== e.pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 意图判断：如果垂直方向位移大于水平方向，说明用户在上下滚动列表，取消横向滑动
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      isSwiping = false;
      swipeStates[id] = { x: 0, sliding: false };
      return;
    }

    // 限制最大滑动距离，防止被拖出屏幕外
    let constrainedDx = dx;
    if (dx > 120) constrainedDx = 120 + (dx - 120) * 0.2; 
    if (dx < -120) constrainedDx = -120 + (dx + 120) * 0.2;

    swipeStates[id] = { x: constrainedDx, sliding: true };
  }

  function onPointerUp(e, id) {
    if (!isSwiping || activePointerId !== e.pointerId) return;
    isSwiping = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const dx = swipeStates[id]?.x || 0;
    // 滑动距离超过 70 像素，则判定为确认删除
    if (Math.abs(dx) > 70) {
      deleteEvent(id);
    } else {
      // 没到阈值，松手弹回原位
      swipeStates[id] = { x: 0, sliding: false };
    }
  }
</script>

{#if showForm || dailyEvents.length > 0}
<div class="user-events-wrapper">
  <div class="section-header">
    <span class="section-title">事件提醒</span>
  </div>

  <div class="user-events-content">
    {#if showForm}
      <div class="input-form" in:slide out:fade>
        <input 
          type="text" 
          placeholder="记录当下..." 
          bind:value={newTaskContent}
          onkeydown={(e) => e.key === 'Enter' && addEvent()}
        />
        <div class="quadrant-tools">
          <button class="tag-btn" class:active={isImportant} onclick={() => isImportant = !isImportant}>重要</button>
          <button class="tag-btn" class:active={isUrgent} onclick={() => isUrgent = !isUrgent}>紧急</button>
          <button class="save-btn" onclick={addEvent}>存入</button>
        </div>
      </div>
    {/if}

    {#if dailyEvents.length > 0}
      <div class="event-list">
        {#each dailyEvents as event (event.id)}
          {@const isVisuallyCompleted = pendingToggles[event.id] !== undefined ? pendingToggles[event.id] : event.isCompleted}
          
          <div 
            class="event-item-wrapper"
            animate:flip={{ duration: 400 }} 
            in:slide|global={{ duration: 300 }}
            out:slide={{ duration: 250 }}
          >
            <div class="swipe-bg">
              <span>🗑️</span>
              <span>🗑️</span>
            </div>

            <div 
              class="event-row {getPriorityClass(event.isImportant, event.isUrgent)}"
              class:is-completed={isVisuallyCompleted}
              style="
                transform: translateX({swipeStates[event.id]?.x || 0}px);
                transition: {swipeStates[event.id]?.sliding ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s'};
              "
              onpointerdown={(e) => onPointerDown(e, event.id)}
              onpointermove={(e) => onPointerMove(e, event.id)}
              onpointerup={(e) => onPointerUp(e, event.id)}
              onpointercancel={(e) => onPointerUp(e, event.id)}
            >
              <button 
                class="status-btn" 
                onpointerdown={(e) => e.stopPropagation()} 
                onclick={() => toggleCompletion(event.id)} 
                title="点击切换状态"
              >
                {isVisuallyCompleted ? '📍' : '📌'}
              </button>
              
              <div class="content-text">{event.content}</div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
  .user-events-wrapper {
    background: #ffffff;
    border-radius: 16px;
    margin-bottom: 16px;
    border: 1px solid #f2f2f2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    overflow: hidden;
  }

  .section-header {
    background-color: #fafafa;
    padding: 8px 14px;
    border-bottom: 1px solid #f2f2f2;
    display: flex;
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: #999;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .user-events-content {
    padding: 14px;
  }

  .input-form {
    background: #f9f9fb;
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 10px;
  }

  .input-form input {
    width: 100%;
    border: none;
    background: transparent;
    border-bottom: 1px solid #e0e0e0;
    padding: 8px 0;
    font-size: 15px;
    margin-bottom: 10px;
    outline: none;
    color: #333333;
  }
  
  .input-form input::placeholder { color: #bbbbbb; }

  .quadrant-tools {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tag-btn {
    border: 1px solid #eee;
    background: #ffffff;
    color: #888;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tag-btn.active {
    background: #333;
    color: #fff;
    border-color: #333;
  }

  .save-btn {
    margin-left: auto;
    background: #007aff;
    color: #fff;
    border: none;
    padding: 4px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .event-list {
    display: flex;
    flex-direction: column;
  }

  /* 列表项外层容器，用来隐藏滑动溢出的部分和放置底部红色背景 */
  .event-item-wrapper {
    position: relative;
    border-bottom: 1px solid #f8f8f8;
    overflow: hidden; 
  }
  .event-item-wrapper:last-child {
    border-bottom: none;
  }

  /* 隐藏在底部的红色删除背景区 */
  .swipe-bg {
    position: absolute;
    inset: 0;
    background-color: #ff3b30;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    font-size: 18px;
    z-index: 1; /* 层级低于表层白板 */
  }

  /* 真正包含文字的表层板块 */
  .event-row {
    position: relative;
    z-index: 2; /* 盖在红底上面 */
    display: flex;
    align-items: center;
    padding: 12px 10px;
    background-color: #ffffff; /* 必须是实色，否则会漏底 */
    /* 允许垂直方向被浏览器原生接管，禁用横向浏览器的返回手势，防止冲突 */
    touch-action: pan-y;
  }

  .status-btn {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    margin-right: 8px;
    cursor: pointer;
    transition: transform 0.1s;
  }
  
  .status-btn:active {
    transform: scale(0.8);
  }

  .content-text {
    font-size: 14px;
    color: #444;
    line-height: 1.4;
    flex: 1; 
    text-align: left; 
    transition: all 0.3s ease;
  }

  /* 优先级视觉呈现 */
  .p0 .content-text { color: #ff3b30; font-weight: 600; } 
  .p1 .content-text { color: #007aff; font-weight: 500;} 
  .p2 .content-text { color: #f1a100; } 

  /* 已完成状态视觉覆盖 */
  .event-row.is-completed {
    opacity: 0.6;
  }
  
  .event-row.is-completed .content-text {
    text-decoration: line-through;
    color: #aaaaaa;
    font-weight: 400; 
  }

  .event-row.is-completed .status-btn {
    filter: grayscale(100%);
  }
</style>