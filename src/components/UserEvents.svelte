<script>
  import { onMount } from 'svelte';
let { selectedDate, showForm = $bindable(false) } = $props();

  let events = $state([]);
  let newTaskContent = $state('');
  let isImportant = $state(false);
  let isUrgent = $state(false);

  onMount(() => {
    const saved = localStorage.getItem('lucky_day_events');
    if (saved) events = JSON.parse(saved);
  });

  $effect(() => {
    localStorage.setItem('lucky_day_events', JSON.stringify(events));
  });

  let dailyEvents = $derived.by(() => {
    const dateStr = selectedDate.toDateString();
    return events.filter(e => e.date === dateStr);
  });

  function addEvent() {
    if (!newTaskContent.trim()) return;
    const newEvent = {
      id: crypto.randomUUID(),
      date: selectedDate.toDateString(),
      content: newTaskContent.trim(),
      isImportant,
      isUrgent
    };
    events = [newEvent, ...events];
    // 清空状态并收起
    newTaskContent = '';
    isImportant = false;
    isUrgent = false;
    showForm = false;
  }

  function deleteEvent(id) {
    events = events.filter(e => e.id !== id);
  }

  function getPriorityClass(imp, urg) {
    if (imp && urg) return 'p0'; 
    if (imp && !urg) return 'p1';
    if (!imp && urg) return 'p2';
    return 'p3';
  }
</script>

{#if showForm || dailyEvents.length > 0}
<div class="user-events-wrapper">
  <div class="section-header">
    <span class="section-title">事件提醒</span>
  </div>

  <div class="user-events-content">
    {#if showForm}
      <div class="input-form">
        <input 
          type="text" 
          placeholder="记录当下..." 
          bind:value={newTaskContent}
          onkeydown={(e) => e.key === 'Enter' && addEvent()}
          style="color: #333 !important;" 
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
          <div class="event-row {getPriorityClass(event.isImportant, event.isUrgent)}">
            <button class="minus-btn" onclick={() => deleteEvent(event.id)}>－</button>
            <div class="content-text">{event.content}</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
/* 外层容器：带框和边距 */
  .user-events-wrapper {
    background: #ffffff;
    border-radius: 16px;
    margin-bottom: 16px;
    border: 1px solid #f2f2f2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    overflow: hidden;
  }

  /* 栏目标题样式 */
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

  .user-events-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 16px;
    border: 1px solid #f2f2f2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  /* --- 输入框修复 --- */
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
    /* 核心修复：确保文字颜色与底框形成对比 */
    color: #333333; 
  }
  
  .input-form input::placeholder {
    color: #bbbbbb;
  }

  .quadrant-tools {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* --- 按钮化四象限选择器 --- */
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

  /* --- 列表与左侧删除 --- */
  .event-list {
    display: flex;
    flex-direction: column;
  }

  .event-row {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f8f8f8;
  }

  .event-row:last-child { border-bottom: none; }

  .minus-btn {
    flex-shrink: 0; /* 防止压扁 */
    aspect-ratio: 1 / 1;
    width: 20px;
    padding: 0;

    height: 18px;
    border-radius: 50%;
    border: 1px solid #ff3b30;
    background: transparent;
    color: #ff3b30;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    margin-right: 12px;
    cursor: pointer;
  }

  .content-text {
    font-size: 14px;
    color: #444;
    line-height: 1.4;
  }

  /* 优先级侧边色条效果 (可选，或通过文字颜色体现) */
  .p0 .content-text { color: #ff3b30; font-weight: 600; } /* 紧要 */
  .p1 .content-text { color: #007aff; } /* 重要 */
  .p2 .content-text { color: #f1a100; } /* 紧急 */
</style>