<script>
  import { onMount } from 'svelte';
  import { db } from '../lib/db';
  import { fade, fly, slide } from 'svelte/transition';

  let { bookId, onBack } = $props();

  let book = $state(null);
  let currentIndex = $state(0); 
  let fontSize = $state(18); 
  let isLoading = $state(true);

  // --- 笔记系统核心状态 ---
  let annotations = $state([]); 
  let selectionMenu = $state({ show: false, x: 0, y: 0, text: '', start: 0, end: 0 });
  let noteEditor = $state({ show: false, note: '' }); 
  
  let viewingNote = $state(null); 
  let isEditingNote = $state(false);
  let editBuffer = $state('');

  let textContainer;

  // --- 滑动手势追踪变量 ---
  let touchStartX = 0;
  let touchStartY = 0;

  async function loadBook() {
    isLoading = true;
    book = await db.books.get(bookId);
    const savedIndex = localStorage.getItem(`read_pos_${bookId}`);
    if (savedIndex) currentIndex = parseInt(savedIndex);
    await loadAnnotations();
    isLoading = false;
  }

  onMount(loadBook);

  async function loadAnnotations() {
    annotations = await db.annotations
      .where('[bookId+chapterIndex]')
      .equals([bookId, currentIndex])
      .toArray();
  }

  async function nextPage() {
    if (currentIndex < book.content.length - 1) {
      currentIndex++;
      saveProgress();
      await loadAnnotations();
      window.scrollTo(0, 0);
    }
  }

  async function prevPage() {
    if (currentIndex > 0) {
      currentIndex--;
      saveProgress();
      await loadAnnotations();
      window.scrollTo(0, 0);
    }
  }

  function saveProgress() {
    localStorage.setItem(`read_pos_${bookId}`, currentIndex.toString());
  }

  function getSelectionOffsets(element) {
    let start = 0, end = 0;
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      start = preCaretRange.toString().length;
      end = start + range.toString().length;
    }
    return { start, end };
  }

  function handleSelection() {
    if (noteEditor.show || viewingNote) return;
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText && selectedText.length > 0 && textContainer) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const offsets = getSelectionOffsets(textContainer);
      const isOverlapping = annotations.some(ann => (offsets.start < ann.endIndex && offsets.end > ann.startIndex));
      if (isOverlapping) { selectionMenu.show = false; return; }
      selectionMenu = { show: true, x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 45, text: selectedText, start: offsets.start, end: offsets.end };
    } else { selectionMenu.show = false; }
  }

  // --- 核心：触摸开始 ---
  function handleTouchStart(e) {
    if (e.touches.length > 1) return; // 忽略多指触控
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  // --- 核心：触摸结束与翻页判定 ---
  function handleTouchEnd(e) {
    // 1. 优先执行划线判定
    handleSelection();

    // 2. 如果当前正在写笔记、看笔记，或者用户刚好选中了文字，绝对禁止翻页
    if (noteEditor.show || viewingNote) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    // 3. 计算滑动向量
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchStartX - touchEndX; // > 0 表示向左滑
    const deltaY = touchStartY - touchEndY;

    // 4. 防误触阈值：水平滑动必须大于 50px，且水平偏移量必须是垂直偏移量的 1.5 倍以上（防止对角线或上下滚动误触发）
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        nextPage(); // 向左滑 -> 阅读下一章
      } else {
        prevPage(); // 向右滑 -> 回到上一章
      }
    }
  }

  function openNoteEditor() {
    selectionMenu.show = false; 
    noteEditor = { show: true, note: '' };
  }

  async function saveNote() {
    if (!noteEditor.note.trim()) return;
    await db.annotations.add({
      bookId: bookId,
      chapterIndex: currentIndex,
      selectedText: selectionMenu.text,
      note: noteEditor.note.trim(),
      startIndex: selectionMenu.start,
      endIndex: selectionMenu.end,
      createdAt: Date.now()
    });
    noteEditor.show = false;
    window.getSelection().removeAllRanges(); 
    await loadAnnotations(); 
  }

  async function updateExistingNote() {
    if (!editBuffer.trim()) return;
    await db.annotations.update(viewingNote.id, {
      note: editBuffer.trim()
    });
    viewingNote.note = editBuffer.trim();
    isEditingNote = false;
    await loadAnnotations();
  }

  function appendToNote() {
    isEditingNote = true;
    const timeStr = new Date().toLocaleString();
    editBuffer = viewingNote.note + `\n\n--- 追加于 ${timeStr} ---\n`;
  }

  function startEditing() {
    editBuffer = viewingNote.note;
    isEditingNote = true;
  }

  function cancelNote() {
    noteEditor.show = false;
    window.getSelection().removeAllRanges();
  }

  function closeViewModal() {
    viewingNote = null;
    isEditingNote = false;
  }

  let highlightedHTML = $derived.by(() => {
    if (!book || !book.content[currentIndex]) return '';
    let html = book.content[currentIndex];
    if (!annotations || annotations.length === 0) return html;
    const sortedAnns = [...annotations].sort((a, b) => b.startIndex - a.startIndex);
    for (const ann of sortedAnns) {
      const before = html.substring(0, ann.startIndex);
      const highlighted = html.substring(ann.startIndex, ann.endIndex);
      const after = html.substring(ann.endIndex);
      html = `${before}<mark class="highlight-mark" data-id="${ann.id}">${highlighted}</mark>${after}`;
    }
    return html;
  });

  function handleTextClick(e) {
    if (e.target && e.target.classList.contains('highlight-mark')) {
      const id = parseInt(e.target.getAttribute('data-id'));
      const ann = annotations.find(a => a.id === id);
      if (ann) {
        viewingNote = ann;
        isEditingNote = false; 
      }
    }
  }

  async function deleteNote(id) {
    if (confirm('确定要抹去这条感悟吗？')) {
      await db.annotations.delete(id);
      closeViewModal();
      await loadAnnotations();
    }
  }
</script>

<!-- 将触摸事件绑定到最外层容器 -->
<div class="reader-container" 
     onmouseup={handleSelection} 
     ontouchstart={handleTouchStart} 
     ontouchend={handleTouchEnd}>
  
  {#if isLoading}
    <div class="loading">正在开启卷轴...</div>
  {:else if book}
    <header class="reader-header">
      <button class="icon-btn" onclick={onBack}>✕</button>
      <div class="book-info">
        <span class="title">{book.title}</span>
        <span class="chapter-info">第 {currentIndex + 1} / {book.content.length} 节</span>
      </div>
      <div class="controls">
        <button onclick={() => fontSize = Math.max(14, fontSize - 2)}>A-</button>
        <button onclick={() => fontSize = Math.min(28, fontSize + 2)}>A+</button>
      </div>
    </header>

    <article class="content-area" style="font-size: {fontSize}px" onclick={handleTextClick}>
      {#key currentIndex}
        <!-- 左右滑动切换页面时的动画效果过渡 -->
        <div in:fade={{ duration: 400 }} class="text-wrapper" bind:this={textContainer}>
          {@html highlightedHTML}
        </div>
      {/key}
    </article>

    <footer class="reader-footer">
      <button onclick={prevPage} disabled={currentIndex === 0}>上一章</button>
      <div class="progress-bar">
        <div class="progress-inner" style="width: {(currentIndex + 1) / book.content.length * 100}%"></div>
      </div>
      <button onclick={nextPage} disabled={currentIndex === book.content.length - 1}>下一章</button>
    </footer>

    {#if selectionMenu.show}
      <div class="selection-toolbar" style="left: {selectionMenu.x}px; top: {selectionMenu.y}px" transition:fly={{ y: 10, duration: 200 }}>
        <button onclick={openNoteEditor}>✍️ 记笔记</button>
        <div class="arrow"></div>
      </div>
    {/if}

    {#if noteEditor.show}
      <div class="modal-overlay" transition:fade={{duration: 200}}>
        <div class="note-modal" transition:fly={{y: 20, duration: 200}}>
          <div class="quote-text">「 {selectionMenu.text} 」</div>
          <textarea bind:value={noteEditor.note} placeholder="写下你的感悟..." autofocus></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" onclick={cancelNote}>取消</button>
            <button class="save-btn" onclick={saveNote}>存入书卷</button>
          </div>
        </div>
      </div>
    {/if}

    {#if viewingNote}
      <div class="modal-overlay" transition:fade={{duration: 200}} onclick={closeViewModal}>
        <div class="note-modal" onclick={e => e.stopPropagation()} transition:fly={{y: 20, duration: 200}}>
          <div class="quote-text">「 {viewingNote.selectedText} 」</div>
          
          {#if isEditingNote}
            <textarea 
                class="edit-textarea"
                bind:value={editBuffer} 
                placeholder="在此修改或追加你的感悟..." 
                autofocus
            ></textarea>
          {:else}
            <div class="note-content-display">{viewingNote.note}</div>
            <div class="note-meta">记录于 {new Date(viewingNote.createdAt).toLocaleDateString()}</div>
          {/if}

          <div class="modal-actions">
            {#if isEditingNote}
                <button class="cancel-btn" onclick={() => isEditingNote = false}>取消</button>
                <button class="save-btn" onclick={updateExistingNote}>保存修改</button>
            {:else}
                <button class="del-btn" onclick={() => deleteNote(viewingNote.id)}>擦除</button>
                <button class="secondary-btn" onclick={appendToNote}>追加</button>
                <button class="secondary-btn" onclick={startEditing}>修改</button>
                <button class="cancel-btn" onclick={closeViewModal}>合上</button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .reader-container { position: fixed; inset: 0; background-color: #F6F1E3; z-index: 1000; display: flex; flex-direction: column; color: #3A3125; user-select: text; }
  .reader-header { display: flex; align-items: center; padding: env(safe-area-inset-top) 16px 12px; background: rgba(246, 241, 227, 0.95); border-bottom: 1px solid #EAE0CA; gap: 12px; }
  .book-info { flex: 1; display: flex; flex-direction: column; }
  .book-info .title { font-size: 15px; font-weight: 600; }
  .book-info .chapter-info { font-size: 11px; color: #8A7F72; }
  .controls button { background: transparent; border: 1px solid #D1C5B4; color: #5A4F43; border-radius: 6px; padding: 4px 10px; margin-left: 6px; font-size: 13px; }

  .content-area { flex: 1; overflow-y: auto; padding: 35px 28px; line-height: 2; text-align: justify; }
  .text-wrapper { white-space: pre-wrap; min-height: 100%; letter-spacing: 1px; }

  :global(.highlight-mark) { background-color: rgba(189, 102, 83, 0.15); border-bottom: 2px solid rgba(189, 102, 83, 0.6); color: inherit; cursor: pointer; padding: 2px 0; }
  
  .reader-footer { display: flex; align-items: center; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid #EAE0CA; background: rgba(246, 241, 227, 0.95); gap: 15px; }
  .reader-footer button { background: #EAE0CA; color: #5A4F43; border: none; padding: 8px 18px; border-radius: 20px; font-size: 13px; }
  .progress-bar { flex: 1; height: 4px; background: #EAE0CA; border-radius: 2px; overflow: hidden; }
  .progress-inner { height: 100%; background: #8B7965; transition: width 0.3s; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(3px); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .note-modal { background: #ffffff; width: 100%; max-width: 400px; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
  .quote-text { font-size: 14px; color: #5A4F43; font-style: italic; border-left: 4px solid #BD6653; padding-left: 12px; margin-bottom: 16px; background: #FDFDFD; }

  .note-content-display { font-size: 16px; color: #222222; line-height: 1.7; margin-bottom: 12px; white-space: pre-wrap; max-height: 250px; overflow-y: auto; }
  .note-meta { font-size: 11px; color: #999; margin-bottom: 16px; }

  textarea, .edit-textarea { width: 100%; height: 160px; border: 1px solid #EAE0CA; border-radius: 8px; padding: 14px; font-size: 15px; line-height: 1.6; color: #333333; background: #FAFAFA; outline: none; box-sizing: border-box; margin-bottom: 10px; }
  textarea:focus { border-color: #BD6653; }

  .modal-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .modal-actions button { padding: 8px 14px; border-radius: 6px; font-size: 13px; border: none; cursor: pointer; font-weight: 500; }
  
  .cancel-btn { background: #F0F0F0; color: #666; }
  .save-btn { background: #8B7965; color: #fff; }
  .secondary-btn { background: #EAE0CA; color: #5A4F43; }
  .del-btn { background: #FFF0F0; color: #FF3B30; }

  .selection-toolbar { position: absolute; transform: translateX(-50%); background: #2C2822; border-radius: 8px; padding: 4px; display: flex; z-index: 2000; box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
  .selection-toolbar button { background: transparent; border: none; color: #F6F1E3; padding: 6px 14px; font-size: 13px; }
</style>