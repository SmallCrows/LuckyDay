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
      // 优化查询，确保无脑按时间倒序
      books = await db.books.orderBy('addedAt').reverse().toArray();
    } catch (e) {
      console.error(e);
      // 处理个别旧数据不兼容
      books = await db.books.toArray();
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
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.5 18.5L2 10L10.5 1.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
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
    <div class="modal-overlay" transition:fade={{duration: 200}}>
      <div class="editor-modal" transition:fly={{y: 20, duration: 250, opacity: 0}}>
        <h3 class="modal-title">{isEditing ? '修缮典籍' : '收录新篇'}</h3>
        
        <div class="input-group">
          <input type="text" placeholder="书名 (必填)" bind:value={editTitle} class="title-input" />
          <input type="text" placeholder="作者/朝代" bind:value={editAuthor} class="author-input" />
        </div>

        <div class="textarea-group">
          <div class="help-text">提示：使用 <b>空行 (按两次回车)</b> 区分章节段落。</div>
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
            <button class="mac-btn primary" onclick={saveBook}>{isEditing ? '保存' : '存入书卷'}</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* 全局强制 box-sizing，防止 padding 撑破容器 */
  :global(*), :global(*::before), :global(*::after) {
    box-sizing: border-box !important;
  }

  .bookshelf-container { 
    padding: env(safe-area-inset-top) 16px 20px; 
    background-color: #f5f5f7; 
    min-height: 100%; 
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 10px 0; }
  
  .back-btn { 
    background: transparent; border: none; font-size: 16px; 
    color: #007aff; cursor: pointer; padding: 8px 0; display: flex; align-items: center; 
  }
  .back-btn:active { opacity: 0.6; }

  .title { font-size: 18px; font-weight: 600; color: #1d1d1f; margin: 0; letter-spacing: 1px; }
  
  /* 修复：使用强制最小宽高锁，锁死正圆形 */
  .add-btn { 
    width: 36px !important; 
    height: 36px !important;
    min-width: 36px !important; 
    min-height: 36px !important;
    flex-shrink: 0 !important;
    padding: 0 !important;
    line-height: 1 !important; /* 核心修复：防止行高撑开 */

    border-radius: 50%; background-color: #1d1d1f; color: #fff; 
    border: none; font-size: 24px; font-weight: 300;
    display: flex; align-items: center; justify-content: center; 
    cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
    -webkit-appearance: none; /* 移除 iOS 默认样式 */
  }

  .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 24px 16px; }
  .book-card { position: relative; aspect-ratio: 3 / 4; border-radius: 4px 8px 8px 4px; background: linear-gradient(135deg, #434345 0%, #1c1c1e 100%); box-shadow: 2px 6px 14px rgba(0, 0, 0, 0.15); cursor: pointer; overflow: hidden; }
  .book-spine { position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%); border-right: 1px solid rgba(0,0,0,0.2); }
  .book-cover { height: 100%; padding: 16px 12px 12px 16px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; }
  .book-title { font-size: 16px; font-weight: 600; color: #f5f5f7; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; text-shadow: 1px 1px 2px rgba(0,0,0,0.6); }
  .book-author { font-size: 10px; color: rgba(255, 255, 255, 0.6); writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 2px; }

  .edit-card-btn {
    position: absolute; bottom: 8px; left: 8px; width: 28px; height: 28px; flex-shrink: 0; padding: 0;
    background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    border-radius: 50%; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.8;
  }

  /* --- 录入编辑器面板样式 (Mac OS UI) --- */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    z-index: 3000; display: flex; align-items: flex-end; /* 手机端靠下，方便输入 */ justify-content: center;
  }

  .editor-modal {
    background: #ffffff; width: 100%; max-width: 500px;
    height: auto; max-height: 85vh; /* 防止输入键盘弹起时顶破屏幕 */
    border-radius: 16px 16px 0 0; /* 手机端圆角在上 */
    padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
    box-shadow: 0 -10px 30px rgba(0,0,0,0.15);
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  /* 适配平板及 PC，居中显示且全圆角 */
  @media (min-width: 501px) {
    .modal-overlay { align-items: center; padding: 16px; }
    .editor-modal { border-radius: 12px; height: 80vh; max-height: 80vh; }
  }

  .modal-title { margin: 0 0 16px 0; font-size: 17px; font-weight: 600; color: #1d1d1f; text-align: center; }

  /* 核心修复：适配作者栏溢出 */
  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    width: 100%; /* 填满父容器 */
  }

  /* 窄屏下（手机）：横向 Flex 改为纵向堆叠 */
  @media (max-width: 400px) {
    .input-group {
      flex-direction: column;
      gap: 8px;
    }
  }

  /* Mac 风格输入框统一处理 */
  input[type="text"], textarea {
    flex: 1;
    width: 100%; /* 强制占满一行，配合 min-width: 0 */
    min-width: 0; /* Flex 窄屏缩放魔法属性，防止内容撑破容器 */
    padding: 12px;
    border: 1px solid #d2d2d7; border-radius: 8px;
    font-size: 15px; color: #1d1d1f !important; background-color: #ffffff !important;
    outline: none; transition: all 0.2s;
  }
  
  input[type="text"]:focus, textarea:focus { 
    border-color: #007aff; box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  }

  .textarea-group { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
  .help-text { font-size: 11px; color: #86868b; margin-bottom: 6px; }
  .textarea-group textarea { flex: 1; line-height: 1.6; resize: none; overflow-y: auto; }

  .modal-actions {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 16px; padding-top: 10px; flex-shrink: 0;
  }
  .right-actions { display: flex; gap: 8px; }

  /* Mac 风格按钮 */
  .mac-btn {
    padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; -webkit-appearance: none;
  }
  .mac-btn:active { transform: scale(0.97); }
  
  .mac-btn.primary { background: #007aff; color: #ffffff; }
  .mac-btn.secondary { background: #e5e5ea; color: #1d1d1f; }
  .mac-btn.destructive { background: transparent; color: #ff3b30; }

  .selection-toolbar { position: absolute; transform: translateX(-50%); background: #2C2822; border-radius: 8px; padding: 4px; display: flex; z-index: 2000; box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
  .selection-toolbar button { background: transparent; border: none; color: #F6F1E3; padding: 6px 14px; font-size: 13px; }
</style>