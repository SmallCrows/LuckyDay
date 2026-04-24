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

 // 极简扩充版文案库 (四大维度，共 100 条)
  const db = {
    overview: [
      "静水流深，宜内向探索。",
      "磁场共振，将迎来意外之喜。",
      "保持钝感力，切忌过度解析周遭环境。",
      "能量充沛，适合推进滞留项目。",
      "屏息凝神，等待关键节点的出现。",
      "宇宙的能量正在向你倾斜，保持接收状态。",
      "抛开不必要的预设，今天会有意想不到的转机。",
      "直觉异常敏锐，请相信你脑海中闪过的第一个念头。",
      "适合按下暂停键，在留白中找回内心的秩序。",
      "一切都在暗中积蓄力量，无需急于求成。",
      "打破常规的作息，会为你引入新的幸运变量。",
      "周围的磁场逐渐趋于平稳，适合做出长远决定。",
      "偶然的相遇并非巧合，注意那些反复出现的信息。",
      "情绪的起伏是正常的潮汐，接纳它，它就会平静。",
      "你的专属光芒无法被掩盖，尽情展现真实的自己。",
      "放缓脚步，今天最美的风景在沿途的细节里。",
      "不要用过去的经验，限制你对今天的想象力。",
      "微小的改变会引起蝴蝶效应，从整理桌面开始。",
      "倾听身体的反馈，它比你的头脑更诚实。",
      "旧的循环正在结束，新的秩序即将在破局中建立。",
      "保持边界感，避免卷入他人无意义的情绪漩涡。",
      "今天适合做减法，清空不需要的物品与执念。",
      "温柔的坚持，往往比激烈的反抗更有力量。",
      "享受孤独的时刻，那是你能量回充的最快途径。",
      "命运的齿轮已悄然转动，顺应水流的方向即可。"
    ],
    love: [
      "剥离期待，关注真实的情感流动。",
      "沟通频率同频，适合解除旧日误会。",
      "保持物理与心理的适度留白。",
      "直觉敏锐，能捕捉到隐秘的情感信号。",
      "真实的脆弱比完美的伪装更有吸引力。",
      "释怀一段过去的执念，是为了给新的羁绊腾出空间。",
      "爱在细节处潜伏，留意那些未曾言语的温柔。",
      "先成为完整的自己，再去寻找共振的另一半。",
      "沟通的屏障正在瓦解，今天是坦诚相待的好时机。",
      "不要试图去控制流向，让感情像水一样自然延展。",
      "适当的示弱，会唤起对方深层的保护欲与共鸣。",
      "精神上的契合，比物质的绑定更加牢不可破。",
      "单身者磁场大开，易在不经意间吸引同频灵魂。",
      "感情需要周期性维护，安排一次没有目的地的漫步。",
      "不要急于要一个确定的答案，让子弹再飞一会儿。",
      "你的独立与自信，是当下最迷人的滤镜。",
      "警惕情绪化的表达，用陈述事实代替指责抱怨。",
      "今天适合制造一点微小的浪漫，比如一束无名花。",
      "在对方需要的时候默默陪伴，胜过千言万语的建议。",
      "打破僵局的契机已经出现，需要你主动迈出半步。",
      "学会欣赏对方的与众不同，哪怕那是你不理解的。",
      "旧日恋情的余波或许会泛起，保持内心的清明。",
      "在爱情中保持独立思考，不要轻易交出自我。",
      "情感浓度适中，是一个充满安全感的温润日子。",
      "用眼睛去倾听，对方的身体语言藏着真实的答案。"
    ],
    career: [
      "避开正面冲突，采取迂回战术。",
      "专注底层逻辑，拒绝无意义的资源消耗。",
      "团队协作呈现高熵状态，需你强力介入梳理。",
      "稳住阵脚，按既定轨道平稳航行。",
      "专注力是今天最宝贵的资产，好钢用在刀刃上。",
      "避开无意义的内耗，把精力留给真正重要的事情。",
      "团队协作中，适时的妥协退让反而能推进全局。",
      "不要畏惧前方的迷雾，走进去你会发现路在脚下。",
      "灵感迸发，适合进行创造性、无边界的头脑风暴。",
      "细节决定成败，今天请对数字和条款保持极度敏感。",
      "你的专业度正在被暗中观察，保持一贯的高水准。",
      "适合向上管理，找准时机抛出你筹谋已久的方案。",
      "跨部门的沟通壁垒即将打通，主动释放善意即可。",
      "职场人际关系微妙，今天宜多听少说，明哲保身。",
      "突破瓶颈的关键，在于引入跨界的全新视角。",
      "不要被繁杂的表象迷惑，抓住核心利益链条去拆解。",
      "今天适合做长线规划，而非纠结于眼前的短暂得失。",
      "某项停滞的任务将迎来转机，准备好随时启动。",
      "你的领导力将被激发，勇敢地承担起关键角色的责任。",
      "警惕信息差带来的风险，在行动前务必多方求证。",
      "职场不是竞技场而是生态圈，实现共赢才是最高解。",
      "学会拒绝不合理的需求，保护好自己的精力边界。",
      "一次非正式的交流，可能会为你带来重要的业务线索。",
      "适度展现野心并不羞耻，那是你向上攀登的驱动力。",
      "化繁为简，今天最高效的方法往往是最原始的那个。"
    ],
    wealth: [
      "资产配置宜收缩，警惕高杠杆诱惑。",
      "小幅波段操作可见效，长线需蛰伏。",
      "正财稳固，偏财隐没于暗处。",
      "知识变现通道开启，可尝试输出。",
      "稳健是当前的底色，避免盲目跟风的高风险操作。",
      "知识是你最大的隐形资产，今天适合为认知买单。",
      "一笔意外的进账正在路上，但要合理规划去向。",
      "清理闲置物品，不仅能腾出空间，还能引来新财运。",
      "对数字的直觉敏锐，适合重新审查近期的账单记录。",
      "花钱买时间的策略是正确的，能帮你创造更大价值。",
      "警惕“熟人背书”的投资机会，保持理性的独立判断。",
      "开源比节流更重要，留意身边未被发掘的副业机会。",
      "今天不宜做出重大的财务决策，让资金在账上多趴一天。",
      "为健康投资是回报率最高的操作，不要在这上面省钱。",
      "财务状况有望迎来小的跃迁，归功于你前期的积累。",
      "分享财富密码，反而能为你建立更深度的利益同盟。",
      "克制冲动消费的欲望，将它转化为对自我提升的投资。",
      "今天可能会面临人情世故的开销，将其视为人脉储蓄。",
      "某个被遗忘的账户或角落，或许藏着一笔小惊喜。",
      "与专业人士的交谈，会让你避开一个潜藏的财务陷阱。",
      "保持现金流的健康，应对未来不确定性的最佳防御。",
      "投资自己永远不会亏本，去买那本你想看很久的书吧。",
      "财运呈现蓄水池效应，进水管畅通，注意堵住漏水点。",
      "适度打赏或捐赠，资金的流动能激活更大的财富能量。",
      "不要只盯着眼前的收益率，关注资产的长期抗风险能力。"
    ]
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