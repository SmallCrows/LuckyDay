<script>
  import { Lunar } from 'lunar-javascript';
  
  // 接收从 App.svelte 传来的全局选定日期
  let { selectedDate } = $props();

  // 使用 $derived 实时计算选中日期的黄历信息
  let almanac = $derived.by(() => {
    const lunar = Lunar.fromDate(selectedDate);
    return {
      ganzhi: `${lunar.getYearInGanZhi()}年 · ${lunar.getMonthInGanZhi()}月 · ${lunar.getDayInGanZhi()}日`,
      shengxiao: lunar.getYearShengXiao(),
      yi: lunar.getDayYi(), // 宜
      ji: lunar.getDayJi(), // 忌
    };
  });
</script>

<div class="almanac-card">
  <div class="ganzhi-header">
    <span class="text">{almanac.ganzhi}</span>
    <span class="tag">{almanac.shengxiao}年</span>
  </div>

  <div class="content">
    <div class="item yi">
      <div class="label">宜</div>
      <div class="list">
        {#each almanac.yi as item}
          <span>{item}</span>
        {/each}
      </div>
    </div>

    <div class="item ji">
      <div class="label">忌</div>
      <div class="list">
        {#each almanac.ji as item}
          <span>{item}</span>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .almanac-card {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
  }

  .ganzhi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #eeeeee;
  }

  .ganzhi-header .text {
    font-size: 13px;
    color: #666;
    font-weight: 500;
  }

  .ganzhi-header .tag {
    font-size: 11px;
    background-color: #fff1f0;
    color: #cf1322;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .item {
    display: flex;
    gap: 12px;
  }

  .label {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
  }

  .yi .label {
    background-color: #f6ffed;
    color: #389e0d;
    border: 1px solid #b7eb8f;
  }

  .ji .label {
    background-color: #fff1f0;
    color: #cf1322;
    border: 1px solid #ffa39e;
  }

  .list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .list span {
    font-size: 14px;
    color: #333;
    font-weight: 400;
  }
</style>