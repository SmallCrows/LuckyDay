<script>
  let { selectedDate } = $props();

  // 1. 星座判定核心逻辑
  const zodiacData = [
    { name: '摩羯座', icon: '♑', cutoff: 20 }, // 1月
    { name: '水瓶座', icon: '♒', cutoff: 19 }, // 2月
    { name: '双鱼座', icon: '♓', cutoff: 21 }, // 3月
    { name: '白羊座', icon: '♈', cutoff: 20 }, // 4月
    { name: '金牛座', icon: '♉', cutoff: 21 }, // 5月
    { name: '双子座', icon: '♊', cutoff: 22 }, // 6月
    { name: '巨蟹座', icon: '♋', cutoff: 23 }, // 7月
    { name: '狮子座', icon: '♌', cutoff: 23 }, // 8月
    { name: '处女座', icon: '♍', cutoff: 23 }, // 9月
    { name: '天秤座', icon: '♎', cutoff: 24 }, // 10月
    { name: '天蝎座', icon: '♏', cutoff: 23 }, // 11月
    { name: '射手座', icon: '♐', cutoff: 22 }  // 12月
  ];

  // 计算当前星座
  let currentZodiac = $derived.by(() => {
    const month = selectedDate.getMonth(); // 0-11
    const day = selectedDate.getDate();
    // 如果日期小于当月的分界线，则属于上一个星座；否则属于当前索引对应的星座
    const index = day < zodiacData[month].cutoff ? (month === 0 ? 11 : month - 1) : month;
    return zodiacData[index];
  });

  // 2. 伪随机数生成器 (基于字符串种子)
  function seededRandom(str) {
    let h = 0x811c9dc5; // FNV-1a 偏移基准
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193); // FNV 素数
    }
    return (h >>> 0) / 4294967296;
  }

  // 3. 极简去脂的文案库 (可后续自行扩充)
  const db = {
    overview: ["静水流深，宜内向探索。", "磁场共振，将迎来意外之喜。", "保持钝感力，切忌过度解析周遭环境。", "能量充沛，适合推进滞留项目。", "屏息凝神，等待关键节点的出现。"],
    love: ["剥离期待，关注真实的情感流动。", "沟通频率同频，适合解除旧日误会。", "保持物理与心理的适度留白。", "直觉敏锐，能捕捉到隐秘的情感信号。"],
    career: ["避开正面冲突，采取迂回战术。", "专注底层逻辑，拒绝无意义的资源消耗。", "团队协作呈现高熵状态，需你强力介入梳理。", "稳点阵脚，按既定轨道航行。"],
    wealth: ["资产配置宜收缩，警惕高杠杆诱惑。", "小幅波段操作可见效，长线需蛰伏。", "正财稳固，偏财隐没于暗处。", "知识变现通道开启，可尝试输出。"]
  };

  // 根据日期和星座生成当日唯一运势
  let fortune = $derived.by(() => {
    const dateStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    const seed = `${dateStr}-${currentZodiac.name}`;
    
    // 生成一系列0-1的伪随机数
    const r1 = seededRandom(seed + "O");
    const r2 = seededRandom(seed + "L");
    const r3 = seededRandom(seed + "C");
    const r4 = seededRandom(seed + "W");

    // 计算星级 (3到5星)
    const stars = 3 + Math.floor(r1 * 3);

    return {
      stars: Array(stars).fill('★').join('') + Array(5 - stars).fill('☆').join(''),
      overview: db.overview[Math.floor(r1 * db.overview.length)],
      love: db.love[Math.floor(r2 * db.love.length)],
      career: db.career[Math.floor(r3 * db.career.length)],
      wealth: db.wealth[Math.floor(r4 * db.wealth.length)]
    };
  });
</script>

<div class="zodiac-card">
  <div class="header">
    <div class="title-group">
      <span class="icon">{currentZodiac.icon}</span>
      <span class="name">{currentZodiac.name}</span>
    </div>
    <div class="rating">{fortune.stars}</div>
  </div>

  <div class="content">
    <div class="desc-text main-desc">{fortune.overview}</div>
    
    <div class="grid-stats">
      <div class="stat-item">
        <span class="label">情感</span>
        <span class="text">{fortune.love}</span>
      </div>
      <div class="stat-item">
        <span class="label">事业</span>
        <span class="text">{fortune.career}</span>
      </div>
      <div class="stat-item">
        <span class="label">财富</span>
        <span class="text">{fortune.wealth}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .zodiac-card {
    background-color: #ffffff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    border: 1px solid #f0f0f0;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed #eeeeee;
    padding-bottom: 12px;
    margin-bottom: 12px;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    font-size: 20px;
    color: #333;
    background: #f5f5f7;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }

  .name {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    letter-spacing: 1px;
  }

  .rating {
    color: #f1a100;
    font-size: 14px;
    letter-spacing: 2px;
  }

  .main-desc {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .grid-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stat-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #f9f9fb;
    padding: 10px 12px;
    border-radius: 8px;
  }

  .label {
    font-size: 11px;
    color: #888;
    background: #e8e8eb;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .text {
    font-size: 13px;
    color: #555;
    line-height: 1.4;
  }
</style>