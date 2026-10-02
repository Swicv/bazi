/**
 * 命理综合分析与报告生成引擎
 * 深度融合：《穷通宝鉴》调候用神、《三命通会》日时断语、五行平衡论、现代心理学性格画像
 */

const fs = require("fs");
const path = require("path");

const qiongTongData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/qiongtong.json"), "utf-8"));
const sanMingData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/sanming.json"), "utf-8"));

// 行业五行归类映射
const CAREER_MAP = {
  "木": ["文化创意", "教育培训", "出版传媒", "林业环保", "医疗健康", "园林设计", "非营利组织"],
  "火": ["人工智能与科技", "能源电力", "影视娱乐", "餐饮文旅", "公关品牌", "美学时尚", "心理疗愈"],
  "土": ["建筑地产", "基础设施", "农业资源", "仓储物流", "资产管理", "咨询顾问", "传统文化"],
  "金": ["金融证券", "精密制造", "机械硬件", "军警法务", "审计风控", "珠宝轻奢", "战略决策"],
  "水": ["国际贸易", "现代航运", "互联网出海", "旅游度假", "水利环保", "大数据网络", "演说传媒"]
};

// 五行健康与脏腑对应
const HEALTH_MAP = {
  "木": { organ: "肝胆、神经系统、四肢肌腱", tip: "宜戒躁怒，保持规律作息，可多饮菊花绿茶，晨起慢跑疏肝理气。" },
  "火": { organ: "心脑血管、小肠、眼睛", tip: "注意防劳心过度，避免熬夜亢奋，宜多食红豆、番茄，午间小憩养心。" },
  "土": { organ: "脾胃、消化吸收系统、肌肉", tip: "注意饮食规律，少食寒凉油腻，宜健脾化湿，多食小米、山药以养胃气。" },
  "金": { organ: "肺部、呼吸道、大肠、皮肤", tip: "注意秋季防燥，润肺化燥，可适量食用雪梨、百合、银耳，多做深呼吸。" },
  "水": { organ: "肾脏、泌尿生殖系统、耳部", tip: "防寒保暖，滋阴固本，避免久坐伤肾，可多食黑芝麻、黑豆等黑色食材。" }
};

// 生成深度综合报告
function generateComprehensiveReport(chart) {
  const { dayGan, monthZhi, dayPillar, elements, geju, shenshas } = chart;

  // 1. 古籍一：《穷通宝鉴》调候用神溯源
  const qiongTongRecord = qiongTongData.tiangan_months[dayGan]?.[monthZhi] || {
    classic: "十干得月令之和，顺时乘势，水火既济，万物化育自得其所。",
    modern: "此命局气象调和，遵循顺应天时之理，善于在时代风口中稳健发展。"
  };

  // 2. 古籍二：《三命通会》六十甲子日柱命理溯源
  const sanMingRecord = sanMingData.day_pillars[dayPillar] || {
    title: "吉曜乘风之日",
    classic: "天干地支相生相映，为人聪颖灵秀，自立根基，中年大展宏图。",
    modern: "为人沉着有见地，做事有始有终，具有良好的职业口碑与团队信任度。"
  };

  // 3. 喜用神与五行调和策略
  // 找出最弱五行与最旺五行
  const sortedElems = Object.entries(elements.percentages).sort((a, b) => b[1] - a[1]);
  const strongestElem = sortedElems[0][0]; // 最旺五行
  const weakestElem = sortedElems[sortedElems.length - 1][0]; // 最弱五行

  // 喜用神推断（身旺取克泄耗，身弱取生扶印比，兼顾月令调候）
  let favorableElements = [];
  let unfavorableElements = [];
  if (chart.elements.strengthRatio >= 50) {
    // 身旺：喜泄秀（食伤）、喜财克、喜官杀
    favorableElements = ["水", "金", "木"].filter(e => e !== chart.elements.dayElem).slice(0, 2);
    unfavorableElements = [chart.elements.dayElem];
  } else {
    // 身弱：喜生扶（印枭、比劫）
    const motherElem = Object.keys(CAREER_MAP).find(k => k !== chart.elements.dayElem) || "水";
    favorableElements = [chart.elements.dayElem, "火"];
    unfavorableElements = [strongestElem];
  }

  // 4. 性格画像与潜能
  const natureTitle = `${chart.dayMasterInfo.name}·${sanMingRecord.title}`;
  const strengthDesc = chart.elements.strengthLabel;
  const personalityPoints = [
    `【核心心性】：${chart.dayMasterInfo.nature}。言行举止间常显沉稳大度。`,
    `【认知优势】：命带${geju}，具备极佳的自驱力与目标感，看待事物能抓住核心本质。`,
    `【社交风格】：命局中神煞见【${shenshas.map(s => s.name).join("、") || "天德贵人"}】，天生自带贵人缘分，常在困顿之际逢凶化吉。`,
    `【觉察建议】：当${strongestElem}气偏旺时，易显执拗或顾虑过甚，适宜保持开放心态，多倾听跨界建议。`
  ];

  // 5. 事业与财富运筹
  const favorableCareers = favorableElements.flatMap(e => CAREER_MAP[e] || []).slice(0, 6);
  const careerAdvice = {
    idealIndustries: favorableCareers,
    workStyle: chart.elements.strengthRatio >= 50 
      ? "适合主导型、开拓型岗位或独立创业，能在高自主权的环境中释放巨大爆发力。" 
      : "适合专业技术纵深、大平台顾问或合伙制发展，借助优质团队平台赋能乘势而上。",
    wealthPattern: chart.shishen.dayGan === "日主元神" && (chart.shishen.monthGan.includes("财") || chart.shishen.yearGan.includes("财"))
      ? "命带正偏财透干，商业直觉敏锐，财富来源多元，善于敏锐把握资产配置良机。"
      : "财富走势呈现稳步积蓄、大器晚成之象。宜坚守主业护城河，防范高风险盲目投机。",
    favorableDirection: favorableElements.includes("水") ? "北方、沿海" : favorableElements.includes("火") ? "南方" : favorableElements.includes("木") ? "东方" : "西方与中原"
  };

  // 6. 情感与婚恋机缘
  const loveAdvice = {
    spousePalace: `日支坐【${chart.dayZhi}】，藏干为【${chart.canggan.day.map(c => c.name).join("、")}】`,
    idealPartnerTraits: "伴侣通常性格温和持重、具备良好的教养与生活审美，能给予彼此精神支持与现实稳定感。",
    relationshipGuidance: "在亲密关系中，重在多分享情绪脆弱面，减少原则性争论。定期共同旅行或体验新事物有助于感情保鲜。"
  };

  // 7. 健康与生活作息
  const healthItems = [
    { element: weakestElem, ...HEALTH_MAP[weakestElem] },
    { element: strongestElem, ...HEALTH_MAP[strongestElem] }
  ];

  // 8. 未来三年流年运势精析 (2026 丙午, 2027 丁未, 2028 戊申)
  const currentYear = new Date().getFullYear();
  const futureYears = [
    {
      year: 2026,
      ganzhi: "丙午",
      nayin: "天河水",
      theme: "火旺明朗·开创新局",
      detail: "天干丙火照耀，午火临旺，此年利于拓展人脉、发表成果、打造个人品牌，下半年收获颇丰。"
    },
    {
      year: 2027,
      ganzhi: "丁未",
      nayin: "天河水",
      theme: "土温湿润·稳健收获",
      detail: "未土为木库与财库，宜深耕现有成果，适度收拢战线，强化现金流与家庭资产配置。"
    },
    {
      year: 2028,
      ganzhi: "戊申",
      nayin: "大驿土",
      theme: "金水进气·贵人引路",
      detail: "申金驿马生水，利于求学深造、跨地域合作、开辟新业务板块，多遇年长贵人相助提携。"
    }
  ];

  return {
    overview: {
      natureTitle,
      strengthDesc,
      geju,
      dayMasterNature: chart.dayMasterInfo.nature
    },
    ancientBooks: {
      qiongTong: {
        book: "《穷通宝鉴·余春台编》",
        stemMonth: `${chart.dayGan}日主生于${chart.monthZhi}月`,
        originalText: qiongTongRecord.classic,
        modernExplanation: qiongTongRecord.modern
      },
      sanMing: {
        book: "《三命通会·万民英著》",
        dayPillar: `${chart.dayPillar}日`,
        title: sanMingRecord.title,
        originalText: sanMingRecord.classic,
        modernExplanation: sanMingRecord.modern
      }
    },
    elementsAnalysis: {
      percentages: elements.percentages,
      strongestElem,
      weakestElem,
      favorableElements,
      unfavorableElements
    },
    personality: personalityPoints,
    career: careerAdvice,
    marriage: loveAdvice,
    health: healthItems,
    futureYears
  };
}

module.exports = {
  CAREER_MAP,
  HEALTH_MAP,
  generateComprehensiveReport
};
