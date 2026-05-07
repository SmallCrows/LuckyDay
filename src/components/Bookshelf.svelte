<script>
  import { onMount } from 'svelte';
  import { db } from '../lib/db'; 
  import { fade, fly } from 'svelte/transition';

  let { onBack, onOpenBook } = $props(); 

  let books = $state([]);
  let isLoading = $state(true);

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
    } catch (e) {
      books = await db.books.toArray();
    } finally {
      isLoading = false;
    }
  }

  onMount(loadBooks);

  function handleBookClick(bookId) {
    if (onOpenBook) onOpenBook(bookId);
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

  function closeEditor() { showEditor = false; }

  async function saveBook() {
    if (!editTitle.trim() || !editContent.trim()) return;
    const contentArray = editContent.split(/\n{2,}/).map(text => text.trim()).filter(text => text.length > 0);
    if (isEditing) {
      await db.books.update(editId, { title: editTitle.trim(), author: editAuthor.trim(), content: contentArray });
    } else {
      await db.books.add({ title: editTitle.trim(), author: editAuthor.trim(), content: contentArray, addedAt: Date.now() });
    }
    closeEditor();
    await loadBooks();
  }

  async function deleteBook() {
    if (confirm(`确认移出《${editTitle}》吗？`)) {
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
      <svg width="12" height="20" viewBox="0 0 12 20" fill="none"><path d="M10.5 18.5L2 10L10.5 1.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      返回
    </button>
    <h2 class="title">典籍</h2>
    <button class="add-btn" onclick={() => openEditor()}>＋</button>
  </div>

  <div class="books-grid">
    {#each books as book (book.id)}
      <div class="book-card" onclick={() => handleBookClick(book.id)}>
        <div class="book-cover">
          <span class="book-title">{book.title}</span>
          <span class="book-author">{book.author}</span>
        </div>
        <div class="book-spine"></div>
        <button class="edit-card-btn" onclick={(e) => { e.stopPropagation(); openEditor(book); }}>⚙️</button>
      </div>
    {/each}
  </div>

  {#if showEditor}
    <div class="modal-overlay" transition:fade={{duration: 200}}>
      <div class="editor-modal" transition:fly={{y: 20, duration: 250}}>
        <h3 class="modal-title">{isEditing ? '修缮典籍' : '收录新篇'}</h3>
        
        <div class="input-group">
          <input type="text" placeholder="书名" bind:value={editTitle} />
          <input type="text" placeholder="作者" bind:value={editAuthor} />
        </div>

        <div class="textarea-group">
          <div class="help-text">提示：按两次回车区分章节。</div>
          <textarea placeholder="粘贴正文..." bind:value={editContent}></textarea>
        </div>

        <div class="modal-actions">
          <div class="left-actions">
            {#if isEditing} <button class="mac-btn destructive" onclick={deleteBook}>删除</button> {/if}
          </div>
          <div class="right-actions">
            <button class="mac-btn secondary" onclick={closeEditor}>取消</button>
            <button class="mac-btn primary" onclick={saveBook}>保存</button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(*) { box-sizing: border-box !important; }
  .bookshelf-container { padding: env(safe-area-inset-top) 16px 20px; background-color: #f5f5f7; min-height: 100%; font-family: -apple-system, sans-serif; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .back-btn { background: transparent; border: none; font-size: 16px; color: #007aff; cursor: pointer; display: flex; align-items: center; }
  .title { font-size: 18px; font-weight: 600; color: #1d1d1f; letter-spacing: 1px; }
  
 .add-btn { 
    flex: 0 0 36px !important;
    width: 36px !important; 
    height: 36px !important;
    border-radius: 50% !important; 
    padding: 0 !important;
    margin: 0 !important;
    
    background-color: #1d1d1f; 
    color: #fff; 
    border: none; 
    font-size: 24px; 
    font-weight: 300;
    
    display: flex; 
    align-items: center; 
    justify-content: center; 
    cursor: pointer; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
    -webkit-appearance: none; 
  }

  .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 24px 16px; }
  .book-card { position: relative; aspect-ratio: 3 / 4; border-radius: 4px 8px 8px 4px; background: linear-gradient(135deg, #434345 0%, #1c1c1e 100%); cursor: pointer; overflow: hidden; }
  .book-spine { position: absolute; top: 0; left: 0; bottom: 0; width: 6px; background: linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%); border-right: 1px solid rgba(0,0,0,0.2); }
  .book-cover { height: 100%; padding: 16px 12px 12px 16px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; }
  .book-title { font-size: 16px; font-weight: 600; color: #f5f5f7; writing-mode: vertical-rl; text-orientation: upright; letter-spacing: 4px; }
  .book-author { font-size: 10px; color: rgba(255, 255, 255, 0.6); writing-mode: vertical-rl; text-orientation: upright; }

  .edit-card-btn { position: absolute; bottom: 8px; left: 8px; width: 28px; height: 28px; background: rgba(255,255,255,0.2); border-radius: 50%; border: none; font-size: 14px; display: flex; align-items: center; justify-content: center; }

  /* --- 关键修复：Mac 风格编辑器适配 --- */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 16px;
  }

  .editor-modal {
    background: #ffffff; width: 100%; max-width: 500px;
    height: 90vh; /* 强制占据屏幕 90% 高度 */
    display: flex; flex-direction: column;
    border-radius: 12px; padding: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  }

  .input-group { display: flex; gap: 10px; margin-bottom: 15px; flex-shrink: 0; }
  @media (max-width: 480px) { .input-group { flex-direction: column; } }

  input[type="text"], textarea {
    padding: 12px; border: 1px solid #d2d2d7; border-radius: 8px;
    font-size: 16px; color: #1d1d1f !important; background-color: #ffffff !important;
    outline: none; font-family: inherit;
  }
  
  .textarea-group { 
    flex: 1; /* 占据所有剩余空间 */
    display: flex; flex-direction: column; min-height: 0; 
  }
  .help-text { font-size: 12px; color: #86868b; margin-bottom: 8px; flex-shrink: 0; }
  
  /* 修复：编辑器高度 */
  textarea { 
    flex: 1; /* 核心：让 textarea 撑开 */
    resize: none; line-height: 1.6;
  }

  .modal-actions { display: flex; justify-content: space-between; padding-top: 15px; flex-shrink: 0; }
  .right-actions { display: flex; gap: 10px; }
  .mac-btn { padding: 10px 20px; border-radius: 8px; font-size: 15px; font-weight: 500; border: none; cursor: pointer; }
  .mac-btn.primary { background: #007aff; color: #fff; }
  .mac-btn.secondary { background: #e5e5ea; color: #1d1d1f; }
  .mac-btn.destructive { color: #ff3b30; background: transparent; }
</style>