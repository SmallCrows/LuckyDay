<script>
  import { onMount } from 'svelte';
  // 请根据你的实际路径调整引入
  import { db } from '../lib/db'; 

  // 定义组件对外的事件或状态传递（这里假设我们通过触发事件让主页切换到阅读器）
 let { onBack, onOpenBook } = $props(); // 新增 onBack

  let books = $state([]);
  let isLoading = $state(true);

  // 从 IndexedDB 拉取书籍列表
  async function loadBooks() {
    try {
      isLoading = true;
      // Dexie 提供的链式查询：按添加时间倒序排列，并转化为数组
      books = await db.books.orderBy('addedAt').reverse().toArray();
    } catch (error) {
      console.error('读取书架失败:', error);
    } finally {
      isLoading = false;
    }
  }

  // 组件挂载时自动拉取数据
  onMount(() => {
    loadBooks();
  });

  // 处理点击书籍事件
  function handleBookClick(bookId) {
    if (onOpenBook) {
      onOpenBook(bookId);
    } else {
      console.log('准备打开书籍 ID:', bookId);
      alert('阅读器引擎正在构建中，即将打开书籍 ID: ' + bookId);
    }
  }
</script>

<div class="bookshelf-container">
 <div class="header">
    <button class="back-btn" onclick={onBack}>&lt; 返回</button>
    <h2 class="title">典籍</h2>
    <button class="add-btn" title="收录新篇">＋</button>
  </div>

  {#if isLoading}
    <div class="empty-state">正在拂去书架上的灰尘...</div>
  {:else if books.length === 0}
    <div class="empty-state">书架空空如也，点击右上角收录第一本典籍吧。</div>
  {:else}
    <div class="books-grid">
      {#each books as book (book.id)}
        <div class="book-card" onclick={() => handleBookClick(book.id)}>
          <div class="book-cover">
            <span class="book-title">{book.title}</span>
            <span class="book-author">{book.author}</span>
          </div>
          <div class="book-spine"></div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .bookshelf-container {
    padding: 20px 16px;
    background-color: #fcfbf9; /* 略带暖色的宣纸白 */
    min-height: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
    letter-spacing: 2px;
  }

  .add-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #333;
    color: #fff;
    border: none;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }
  
  .add-btn:active {
    transform: scale(0.9);
  }

  .empty-state {
    text-align: center;
    color: #999;
    font-size: 14px;
    padding: 40px 0;
  }

  .books-grid {
    display: grid;
    /* 响应式网格：手机上大概一排3本，平板上更多 */
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 20px 16px;
  }

  .book-card {
    position: relative;
    aspect-ratio: 3 / 4; /* 经典的实体书比例 */
    border-radius: 4px 8px 8px 4px; /* 右侧更圆润，模仿书页 */
    background: linear-gradient(135deg, #4a4a4a 0%, #2b2b2b 100%); /* 深色书皮 */
    box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }

  .book-card:active {
    transform: translateY(2px) scale(0.98);
    box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.15);
  }

  /* 制造立体书脊的视觉假象 */
  .book-spine {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 6px;
    background: linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
    border-right: 1px solid rgba(0,0,0,0.2);
  }

  .book-cover {
    height: 100%;
    padding: 16px 12px 12px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end; /* 书名通常靠右/靠上排列 */
    box-sizing: border-box;
  }

  .book-title {
    font-size: 16px;
    font-weight: bold;
    color: #fff;
    /* 让文字竖排显示，更有古籍韵味 */
    writing-mode: vertical-rl;
    text-orientation: upright;
    letter-spacing: 4px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .book-author {
    font-size: 10px;
    color: #rgba(255, 255, 255, 0.7);
    color: rgba(255, 255, 255, 0.7);
    writing-mode: vertical-rl;
    text-orientation: upright;
    letter-spacing: 2px;
  }

  .back-btn {
    background: transparent;
    border: none;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    padding: 8px 0;
  }
</style>