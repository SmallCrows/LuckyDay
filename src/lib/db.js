import Dexie from 'dexie';

// 1. 实例化数据库
export const db = new Dexie('ClassicLitDB');

// 2. 声明表结构
db.version(1).stores({
  books: '++id, title, author, addedAt',
  annotations: '++id, bookId, chapterIndex, [bookId+chapterIndex], createdAt'
});

// --- 核心接口：添加文献 ---
// 这个接口既可以用来初始化内置书，以后也可以绑定到前端页面让用户自己添加
export async function addBook(title, author, contentArray) {
  return await db.books.add({
    title,
    author,
    content: contentArray, // 推荐传入数组，每段/每章为一项
    addedAt: Date.now()
  });
}

// --- 预设内置经典库 ---
// 为什么 content 要用数组？
// 强烈建议将古籍按“章”或“段”切分成数组保存，而不是一整坨巨大的字符串。
// 以后做“高亮划线”时，我们可以精准定位到“第一章的第5-10个字”，渲染性能极高。
const defaultBooks = [
  {
    title: '道德经',
    author: '老子',
    content: [
      "道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲以观其妙，常有欲以观其徼。此两者同出而异名，同谓之玄。玄之又玄，众妙之门。",
      "天下皆知美之为美，斯恶已；皆知善之为善，斯不善已。故有无相生，难易相成，长短相形，高下相倾，音声相和，前后相随。是以圣人处无为之事，行不言之教，万物作焉而不辞，生而不有，为而不恃，功成而弗居。夫唯弗居，是以不去。"
      // 这里只放了两章示意，你可以自行补全 81 章
    ]
  },
  {
    title: '阴符经',
    author: '黄帝 (传)',
    content: [
      "观天之道，执天之行，尽矣。故天有五贼，见之者昌。五贼在心，施行于天。宇宙在乎手，万化生乎身。",
      "天性，人也。人心，机也。立天之道，以定人也。天发杀机，移星易宿。地发杀机，龙蛇起陆。人发杀机，天地反覆。天人合发，万化定基。"
      // 阴符经较短，可以直接按段落切分
    ]
  }
];

// --- 初始化检测脚本 ---
export async function initDatabaseIfNeeded() {
  try {
    // 检测书籍表中有几条数据
    const count = await db.books.count();
    
    if (count === 0) {
      console.log('📚 [数据库初始化] 首次运行，正在载入内置经典文献...');
      
      // 批量写入默认数据
      const booksToInsert = defaultBooks.map(book => ({
        ...book,
        addedAt: Date.now()
      }));
      
      await db.books.bulkAdd(booksToInsert);
      console.log('✅ [数据库初始化] 内置文献载入完毕！');
    } else {
      console.log(`📚 [数据库就绪] 本地已有 ${count} 部文献。`);
    }
  } catch (error) {
    console.error('❌ [数据库错误] 初始化失败:', error);
  }
}