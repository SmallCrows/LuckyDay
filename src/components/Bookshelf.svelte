<script>
  import { onMount } from 'svelte';
  import { db } from '../lib/db'; 
  import { fade, fly } from 'svelte/transition';

  let { onBack, onOpenBook } = $props(); 

  let books = $state([]);
  let isLoading = $state(true);

  // --- 编辑器相关状态 ---
  let showEditor = $state(false);
  let isEditing = $state(false); 
  let editId = $state(null);
  let editTitle = $state('');
  let editAuthor = $state('');
  let editContent = $state(''); 

  async function loadBooks() {
    try {
      isLoading = true;
      books = await db.books.orderBy('addedAt').reverse().toArray();
    } finally {
      isLoading = false;
    }
  }

  onMount(loadBooks);

  function handleBookClick(bookId) {
    if (onOpenBook) {
      onOpenBook(bookId); 
    }
  }

  function openEditor(book = null) {
    if (book) {
      isEditing = true;
      editId = book.id;
      editTitle = book.title;
      editAuthor = book.author || '';
      editContent = book.content.join('\n\n'); 
    } else {
      isEditing = false;
      editId = null;
      editTitle = '';
      editAuthor = '';
      editContent = '';
    }
    showEditor = true;
  }

  function closeEditor() {
    showEditor = false;
  }

  async function saveBook() {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('书名与正文不可为空');
      return;
    }

    const contentArray = editContent
      .split(/\n{2,}/) 
      .map(text => text.trim()) 
      .filter(text => text.length > 0); 

    if (isEditing) {
      await db.books.update(editId, {
        title: editTitle.trim(),
        author: editAuthor.trim(),
        content: contentArray
      });
    } else {
      await db.books.add({
        title: editTitle.trim(),
        author: editAuthor.trim(),
        content: contentArray,
        addedAt: Date.now()
      });
    }

    closeEditor();
    await loadBooks(); 
  }

  async function deleteBook() {
    if (confirm(`确认要将《${editTitle}》移出书架吗？相关的笔记也将被一并抹去。`)) {
      await db.books.delete(editId);
      await db.annotations.where('bookId').equals(editId).delete();
      closeEditor();
      await loadBooks(); 
    }
  }
</script>

<div class="bookshelf-container">
  <div class="header">
    <button class="back-btn" onclick={onBack}>
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px;">
        <path d="M10.5 18.5L2 10L10.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      返回
    </button>
    <h2 class="title">典籍</h2>
    <button class="add-btn" title="收录新篇" onclick={() => openEditor()}>＋</button>
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
          
          <button 
            class="edit-card-btn" 
            onclick={(e) => { e.stopPropagation(); openEditor(book); }}
            title="修缮"
          >
            ⚙️
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if showEditor}
    <div class="modal-overlay" transition:fade={{duration: 250}}>
      <div class="editor-modal" transition:fly={{y: 30, duration: 300, opacity: 0}}>
        <h3 class="modal-title">{isEditing ? '修缮典籍' : '收录新篇'}</h3>
        
        <div class="input-group">
          <input type="text" placeholder="书名 (必填)" bind:value={editTitle} />
          <input type="text" placeholder="作者/朝代" bind:value={editAuthor} />
        </div>

        <div class="textarea-group">
          <div class="help-text">提示：请使用 <b>空行 (按两次回车)</b> 来区分不同的章节或大段落。</div>
          <textarea 
            placeholder="在此粘贴古籍正文..." 
            bind:value={editContent}
          ></textarea>
        </div>

        <div class="modal-actions">
          <div class="left-actions">
            {#if isEditing}
              <button class="mac-btn destructive" onclick={deleteBook}>移出书架</button>
            {/if}
          </div>
          <div class="right-actions">
            <button class="mac-btn secondary" onclick={closeEditor}>放弃</button>
            <button class="mac-btn primary" onclick={saveBook}>{isEditing ? '保存修缮' : '封卷入库'}</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* 全局字体：Apple 系统默认 */
  .bookshelf-container { 
    padding: 20px 16px; 
    background-color: #f5f5f7; /* Mac 经典浅灰背景 */
    min-height: 100%; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  /* --- 头部导航 --- */
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  
  .back-btn { 
    background: transparent; border: none; font-size: 16px; 
    color: #007aff; /* Mac 经典蓝 */
    cursor: pointer; padding: 8px 0; display: flex; align-items: center; 
  }
  .back-btn:active { opacity: 0.6; }

  .title { font-size: 18px; font-weight: 600; color: #1d1d1f; margin: 0; letter-spacing: 1px; }
  
  /* 修复：右上角新增按钮防压扁 */
  .add-btn { 
    width: 32px; height: 32px; flex-shrink: 0;
    border-radius: 50%; background-color: #1d1d1f; color: #fff; 
    border: none; font-size: 20px; font-weight: 300;
    display: flex; align-items: center; justify-content: center; 
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
    transition: transform 0.2s; 
  }
  .add-btn:active { transform: scale(0.9); }

  .empty-state { text-align: center; color: #86868b; font-size: 14px; padding: 40px 0; }

  /* --- 书架阵列 --- */
  .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 24px 16px; }
  .book-card { 
    position: relative; aspect-ratio: 3 / 4; border-radius: 4px 8px 8px 4px; 
    background: linear-gradient(135deg, #434345 0%, #1c1c1e 100%); 
    box-shadow: 2px 6px 14px rgba(0, 0, 0, 0.15); cursor: pointer; 
    transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; 
  }
  .book-card:active { transform: translateY(2px) scale(0.98); box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.15); }
  .book-spine { position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%); border-right: 1px solid rgba(0,0,0,0.2); }
  .book-cover { height: 100%; padding: 16px 12px 12px 16px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; box-sizing: border-box; }
  .book-title { font-size: 16px; font-weight: 600; color: #f5f5f7; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; text-shadow: 1px 1px 2px rgba(0,0,0,0.6); }
  .book-author { font-size: 10px; color: rgba(255, 255, 255, 0.6); writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px; }

  /* 修复：卡片编辑按钮防压扁，采用半透明毛玻璃质感 */
  .edit-card-btn {
    position: absolute;
    bottom: 8px;
    left: 8px;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0.7;
    padding: 0;
  }
  .book-card:hover .edit-card-btn { opacity: 1; background: rgba(255, 255, 255, 0.25); }
  .edit-card-btn:active { transform: scale(0.9); }

  /* --- 录入编辑器面板样式 (Mac OS UI) --- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .editor-modal {
    background: #ffffff; /* 必须纯白，防止继承深色模式 */
    width: 100%;
    max-width: 520px;
    height: 80vh;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .modal-title {
    margin: 0 0 20px 0;
    font-size: 17px;
    font-weight: 600;
    color: #1d1d1f;
    text-align: center;
  }

  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  /* Mac 风格输入框统一处理 */
  input[type="text"], textarea {
    flex: 1;
    padding: 12px 14px;
    border: 1px solid #d2d2d7;
    border-radius: 8px;
    font-size: 15px;
    color: #1d1d1f !important; /* 强制文字深色，阻断系统级深色模式污染 */
    background-color: #ffffff !important; /* 强制背景纯白 */
    outline: none;
    transition: all 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  input[type="text"]::placeholder, textarea::placeholder {
    color: #86868b;
  }

  /* Mac 标志性的焦点光晕 */
  input[type="text"]:focus, textarea:focus { 
    border-color: #007aff; 
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  }

  .textarea-group {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0; /* 允许在 flex 容器中正确收缩 */
  }

  .help-text {
    font-size: 12px;
    color: #86868b;
    margin-bottom: 8px;
  }

  .textarea-group textarea {
    flex: 1;
    line-height: 1.6;
    resize: none;
  }

  .modal-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding-top: 16px;
  }

  .right-actions { display: flex; gap: 12px; }

  /* Mac 风格按钮 */
  .mac-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mac-btn:active { transform: scale(0.96); }
  
  .mac-btn.primary { background: #007aff; color: #ffffff; }
  .mac-btn.primary:hover { background: #006ce6; }
  
  .mac-btn.secondary { background: #e5e5ea; color: #1d1d1f; }
  .mac-btn.secondary:hover { background: #d1d1d6; }
  
  .mac-btn.destructive { background: transparent; color: #ff3b30; padding: 10px 8px; }
  .mac-btn.destructive:hover { background: #ffeeed; }
</style>