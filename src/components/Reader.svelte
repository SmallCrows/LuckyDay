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

  let textContainer;

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

      const isOverlapping = annotations.some(ann => 
        (offsets.start < ann.endIndex && offsets.end > ann.startIndex)
      );

      if (isOverlapping) {
        selectionMenu.show = false;
        return; 
      }

      selectionMenu = {
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 45,
        text: selectedText,
        start: offsets.start,
        end: offsets.end
      };
    } else {
      selectionMenu.show = false;
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

  function cancelNote() {
    noteEditor.show = false;
    window.getSelection().removeAllRanges();
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
      }
    }
  }

  async function deleteNote(id) {
    if (confirm('确定要抹去这条感悟吗？')) {
      await db.annotations.delete(id);
      viewingNote = null;
      await loadAnnotations();
    }
  }
</script>

<div class="reader-container" onmouseup={handleSelection} ontouchend={handleSelection}>
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
      <div 
        class="selection-toolbar" 
        style="left: {selectionMenu.x}px; top: {selectionMenu.y}px"
        transition:fly={{ y: 10, duration: 200 }}
      >
        <button onclick={openNoteEditor}>✍️ 记笔记</button>
        <div class="arrow"></div>
      </div>
    {/if}

    {#if noteEditor.show}
      <div class="modal-overlay" transition:fade={{duration: 200}}>
        <div class="note-modal" transition:fly={{y: 20, duration: 200}}>
          <div class="quote-text">「 {selectionMenu.text} 」</div>
          <textarea 
            bind:value={noteEditor.note} 
            placeholder="写下你的感悟..."
            autofocus
          ></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" onclick={cancelNote}>取消</button>
            <button class="save-btn" onclick={saveNote}>存入书卷</button>
          </div>
        </div>
      </div>
    {/if}

    {#if viewingNote}
      <div class="modal-overlay" transition:fade={{duration: 200}} onclick={() => viewingNote = null}>
        <div class="note-modal view-mode" onclick={e => e.stopPropagation()} transition:fly={{y: 20, duration: 200}}>
          <div class="quote-text">「 {viewingNote.selectedText} 」</div>
          <div class="note-content">{viewingNote.note}</div>
          <div class="note-meta">记录于 {new Date(viewingNote.createdAt).toLocaleDateString()}</div>
          <div class="modal-actions">
            <button class="del-btn" onclick={() => deleteNote(viewingNote.id)}>擦除</button>
            <button class="cancel-btn" onclick={() => viewingNote = null}>合上</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  /* --- 全局阅读器主题配色：古纸墨香 --- */
  .reader-container {
    position: fixed;
    inset: 0;
    background-color: #F6F1E3; /* 象牙白纸色，极度护眼 */
    z-index: 1000;
    display: flex;
    flex-direction: column;
    color: #3A3125; /* 陈墨褐色，降低高对比度疲劳 */
    user-select: text; 
  }

  /* --- 导航栏与底部控制栏 --- */
  .reader-header {
    display: flex;
    align-items: center;
    padding: env(safe-area-inset-top) 16px 12px;
    background: rgba(246, 241, 227, 0.95);
    border-bottom: 1px solid #EAE0CA; /* 柔和的边线 */
    gap: 12px;
  }

  .book-info { flex: 1; display: flex; flex-direction: column; }
  .book-info .title { font-size: 15px; font-weight: 600; letter-spacing: 1px; }
  .book-info .chapter-info { font-size: 11px; color: #8A7F72; margin-top: 2px;}

  .controls button {
    background: transparent;
    border: 1px solid #D1C5B4;
    color: #5A4F43;
    border-radius: 6px;
    padding: 4px 10px;
    margin-left: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  /* --- 正文排版 --- */
  .content-area {
    flex: 1;
    overflow-y: auto;
    padding: 35px 28px;
    line-height: 2; /* 增大行高，让古文留白更多 */
    text-align: justify;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", serif;
  }

  .text-wrapper {
    white-space: pre-wrap; 
    min-height: 100%;
    letter-spacing: 1px; /* 增加字间距，呼吸感 */
  }

  /* 动态高亮标签：朱砂色 */
  :global(.highlight-mark) {
    background-color: rgba(189, 102, 83, 0.15); /* 淡淡的朱砂背景 */
    border-bottom: 2px solid rgba(189, 102, 83, 0.6); /* 朱砂下划线 */
    color: inherit;
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 2px 0;
  }
  :global(.highlight-mark:active) {
    background-color: rgba(189, 102, 83, 0.3);
  }

  /* --- 底部翻页栏 --- */
  .reader-footer {
    display: flex;
    align-items: center;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid #EAE0CA;
    background: rgba(246, 241, 227, 0.95);
    gap: 15px;
  }

  .reader-footer button {
    background: #EAE0CA;
    color: #5A4F43;
    border: none;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
  }
  .reader-footer button:disabled { opacity: 0.3; cursor: not-allowed; }

  .progress-bar { flex: 1; height: 4px; background: #EAE0CA; border-radius: 2px; overflow: hidden; }
  .progress-inner { height: 100%; background: #8B7965; transition: width 0.3s; }

  /* --- 悬浮菜单 --- */
  .selection-toolbar {
    position: absolute;
    transform: translateX(-50%);
    background: #2C2822; /* 深墨色 */
    border-radius: 8px;
    padding: 4px;
    display: flex;
    z-index: 2000;
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .selection-toolbar button { background: transparent; border: none; color: #F6F1E3; padding: 6px 14px; font-size: 13px; cursor: pointer; }
  .selection-toolbar .arrow { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #2C2822; }
  
  .loading { display: flex; height: 100%; align-items: center; justify-content: center; color: #8A7F72; }
  .icon-btn { background: none; border: none; font-size: 22px; color: #5A4F43; cursor: pointer; }

  /* --- 模态框样式优化 --- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5); /* 加深背景遮罩，突出输入框 */
    backdrop-filter: blur(3px);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .note-modal {
    background: #ffffff; /* 保持纯白底色，确保极高对比度和清晰度 */
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }

  .quote-text {
    font-size: 14px;
    color: #5A4F43;
    font-style: italic;
    border-left: 4px solid #BD6653; /* 朱砂色引言线 */
    padding-left: 12px;
    margin-bottom: 20px;
    line-height: 1.6;
    background: #FDFDFD;
  }

  .note-modal textarea {
    width: 100%;
    height: 140px;
    border: 1px solid #EAE0CA;
    border-radius: 8px;
    padding: 14px;
    font-size: 15px;
    line-height: 1.6;
    color: #333333; /* 核心修复：强制文字为深色，绝不会再出现白字 */
    resize: none;
    outline: none;
    background: #FAFAFA;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .note-modal textarea:focus { border-color: #BD6653; } /* 焦点色也是朱砂 */

  .view-mode .note-content {
    font-size: 16px;
    color: #222222;
    line-height: 1.7;
    margin-bottom: 12px;
    font-weight: 500;
  }
  .note-meta { font-size: 12px; color: #999; margin-bottom: 24px; }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }

  .modal-actions button {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }
  
  .cancel-btn { background: #F0F0F0; color: #666; }
  .save-btn { background: #8B7965; color: #fff; } /* 与进度条同色的深褐 */
  .del-btn { background: #FFF0F0; color: #FF3B30; }
</style>