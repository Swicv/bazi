/**
 * 专业八字排盘与命理数理推算核心模块
 * 涵盖：藏干十神推算、六十甲子纳音、五行力量百分比打分、神煞吉凶、大运顺逆起运、格局判定
 */

const fs = require("fs");
const path = require("path");
const { TIANGAN, DIZHI, calculateBaZiPillars } = require("./calendar");

const rulesPath = path.join(__dirname, "../data/bazi_rules.json");
const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));

// 五行生克关系
const ELEMENTS = ["木", "火", "土", "金", "水"];
const ELEMENT_GENERATES = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
const ELEMENT_OVERCOMES = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

// 推算十神关系
function getShiShen(dayGan, targetGan) {
  if (!dayGan || !targetGan) return "比肩";
  if (dayGan === targetGan) return "比肩";

  const dayInfo = rules.tiangan[dayGan];
  const targetInfo = rules.tiangan[targetGan];
  if (!dayInfo || !targetInfo) return "比肩";

  const samePolarity = dayInfo.yin_yang === targetInfo.yin_yang;
  const dayElem = dayInfo.element;
  const targetElem = targetInfo.element;

  // 同我者：比肩 / 劫财
  if (dayElem === targetElem) {
    return samePolarity ? "比肩" : "劫财";
  }
  // 我生者：食神 / 伤官
  if (ELEMENT_GENERATES[dayElem] === targetElem) {
    return samePolarity ? "食神" : "伤官";
  }
  // 生我者：偏印 / 正印
  if (ELEMENT_GENERATES[targetElem] === dayElem) {
    return samePolarity ? "偏印" : "正印";
  }
  // 我克者：偏财 / 正财
  if (ELEMENT_OVERCOMES[dayElem] === targetElem) {
    return samePolarity ? "偏财" : "正财";
  }
  // 克我者：七杀 / 正官
  if (ELEMENT_OVERCOMES[targetElem] === dayElem) {
    return samePolarity ? "七杀" : "正官";
  }

  return "比肩";
}

// 获取地支藏干及其十神
function getBranchCangGan(dayGan, zhi) {
  const zhiInfo = rules.dizhi[zhi];
  if (!zhiInfo) return [];

  return zhiInfo.canggan.map(([gan, name, weight]) => {
    return {
      gan,
      name,
      weight,
      shishen: getShiShen(dayGan, gan)
    };
  });
}

// 计算神煞
function calculateShenSha(dayGan, dayZhi, yearGan, yearZhi, allZhis) {
  const result = [];
  const zhiSet = new Set(allZhis);

  // 1. 天乙贵人："甲戊并牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，庚辛逢虎马，此是贵人方"
  const tianyiMap = {
    "甲": ["丑", "未"], "戊": ["丑", "未"],
    "乙": ["子", "申"], "己": ["子", "申"],
    "丙": ["亥", "酉"], "丁": ["亥", "酉"],
    "壬": ["卯", "巳"], "癸": ["卯", "巳"],
    "庚": ["寅", "午"], "辛": ["寅", "午"]
  };
  const tianyiZhis = tianyiMap[dayGan] || [];
  tianyiZhis.forEach(z => {
    if (zhiSet.has(z)) result.push({ name: "天乙贵人", zhi: z, ...rules.shensha_rules["天乙贵人"] });
  });

  // 2. 文昌贵人："甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见卯入云梯"
  const wenchangMap = {
    "甲": "巳", "乙": "午", "丙": "申", "戊": "申",
    "丁": "酉", "己": "酉", "庚": "亥", "辛": "子",
    "壬": "寅", "癸": "卯"
  };
  const wcZhi = wenchangMap[dayGan];
  if (wcZhi && zhiSet.has(wcZhi)) {
    result.push({ name: "文昌贵人", zhi: wcZhi, ...rules.shensha_rules["文昌贵人"] });
  }

  // 3. 禄神："甲禄在寅乙在卯，丙戊在巳丁己午，庚禄在申辛在酉，壬禄在亥癸在子"
  const luMap = {
    "甲": "寅", "乙": "卯", "丙": "巳", "戊": "巳",
    "丁": "午", "己": "午", "庚": "申", "辛": "酉",
    "壬": "亥", "癸": "子"
  };
  const luZhi = luMap[dayGan];
  if (luZhi && zhiSet.has(luZhi)) {
    result.push({ name: "禄神", zhi: luZhi, ...rules.shensha_rules["禄神"] });
  }

  // 4. 羊刃："甲羊刃在卯，丙戊在午，庚在酉，壬在子"
  const yangrenMap = { "甲": "卯", "丙": "午", "戊": "午", "庚": "酉", "壬": "子" };
  const yrZhi = yangrenMap[dayGan];
  if (yrZhi && zhiSet.has(yrZhi)) {
    result.push({ name: "羊刃", zhi: yrZhi, ...rules.shensha_rules["羊刃"] });
  }

  // 5. 驿马、华盖、将星、桃花（以年支或日支查）
  // 申子辰见寅为马，见辰为华盖，见子为将星，见酉为桃花
  // 寅午戌见申为马，见戌为华盖，见午为将星，见卯为桃花
  // 巳酉丑见亥为马，见丑为华盖，见酉为将星，见午为桃花
  // 亥卯未见巳为马，见未为华盖，见卯为将星，见子为桃花
  const sanheGroup = {
    "申": "水", "子": "水", "辰": "水",
    "寅": "火", "午": "火", "戌": "火",
    "巳": "金", "酉": "金", "丑": "金",
    "亥": "木", "卯": "木", "未": "木"
  };
  const sanheType = sanheGroup[dayZhi] || sanheGroup[yearZhi];
  const groupRules = {
    "水": { yima: "寅", huagai: "辰", jiangxing: "子", taohua: "酉" },
    "火": { yima: "申", huagai: "戌", jiangxing: "午", taohua: "卯" },
    "金": { yima: "亥", huagai: "丑", jiangxing: "酉", taohua: "午" },
    "木": { yima: "巳", huagai: "未", jiangxing: "卯", taohua: "子" }
  };
  if (sanheType && groupRules[sanheType]) {
    const gr = groupRules[sanheType];
    if (zhiSet.has(gr.yima)) result.push({ name: "驿马", zhi: gr.yima, ...rules.shensha_rules["驿马"] });
    if (zhiSet.has(gr.huagai)) result.push({ name: "华盖", zhi: gr.huagai, ...rules.shensha_rules["华盖"] });
    if (zhiSet.has(gr.jiangxing)) result.push({ name: "将星", zhi: gr.jiangxing, ...rules.shensha_rules["将星"] });
    if (zhiSet.has(gr.taohua)) result.push({ name: "桃花", zhi: gr.taohua, ...rules.shensha_rules["桃花"] });
  }

  // 6. 太极贵人："甲乙生人子午中，丙丁鸡兔定亨通，戊己两干临四季，庚辛寅亥禄丰隆，壬癸巳申偏喜美"
  const taijiMap = {
    "甲": ["子", "午"], "乙": ["子", "午"],
    "丙": ["酉", "卯"], "丁": ["酉", "卯"],
    "戊": ["辰", "戌", "丑", "未"], "己": ["辰", "戌", "丑", "未"],
    "庚": ["寅", "亥"], "辛": ["寅", "亥"],
    "壬": ["巳", "申"], "癸": ["巳", "申"]
  };
  const tjZhis = taijiMap[dayGan] || [];
  tjZhis.forEach(z => {
    if (zhiSet.has(z)) result.push({ name: "太极贵人", zhi: z, ...rules.shensha_rules["太极贵人"] });
  });

  // 去重
  const unique = [];
  const seen = new Set();
  result.forEach(item => {
    const k = `${item.name}-${item.zhi}`;
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(item);
    }
  });

  return unique;
}

// 计算五行力量分布（包含天干赋分与地支藏干权重）
function calculateElementsScore(pillars) {
  const scores = { "木": 0, "火": "0", "土": 0, "金": 0, "水": 0 };
  scores["木"] = 0; scores["火"] = 0; scores["土"] = 0; scores["金"] = 0; scores["水"] = 0;

  // 天干权重：年10，月15，日(日主)15，时10
  const ganWeights = [10, 15, 15, 10];
  const gans = [pillars.yearGan, pillars.monthGan, pillars.dayGan, pillars.hourGan];
  gans.forEach((g, idx) => {
    const elem = rules.tiangan[g]?.element;
    if (elem) scores[elem] += ganWeights[idx];
  });

  // 地支权重（月令得令权重大）：年15，月令35，日支20，时支15
  const zhiWeights = [15, 35, 20, 15];
  const zhis = [pillars.yearZhi, pillars.monthZhi, pillars.dayZhi, pillars.hourZhi];
  zhis.forEach((z, idx) => {
    const zhiInfo = rules.dizhi[z];
    if (zhiInfo) {
      zhiInfo.canggan.forEach(([gan, , weight]) => {
        const elem = rules.tiangan[gan]?.element;
        if (elem) scores[elem] += Math.round(zhiWeights[idx] * weight);
      });
    }
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const percentages = {};
  for (const [k, v] of Object.entries(scores)) {
    percentages[k] = Math.round((v / total) * 100);
  }

  // 评估日主强弱
  const dayElem = rules.tiangan[pillars.dayGan]?.element;
  const sameAndGenerate = scores[dayElem] + (scores[Object.keys(ELEMENT_GENERATES).find(k => ELEMENT_GENERATES[k] === dayElem)] || 0);
  const strengthRatio = Math.round((sameAndGenerate / total) * 100);
  let strengthLabel = "中和平衡";
  if (strengthRatio >= 55) strengthLabel = "身旺（能量充沛）";
  else if (strengthRatio <= 35) strengthLabel = "身弱（喜扶助滋荣）";

  return { scores, percentages, strengthRatio, strengthLabel, dayElem };
}

// 判定命局格局
function determineGeJu(dayGan, monthZhi, pillars) {
  const monthInfo = rules.dizhi[monthZhi];
  if (!monthInfo) return "杂气格";

  const mainGan = monthInfo.canggan[0][0]; // 月令主气
  const mainShiShen = getShiShen(dayGan, mainGan);

  // 建禄格与阳刃格特殊处理
  if (mainShiShen === "比肩") return "建禄格";
  if (mainShiShen === "劫财") return "阳刃格";

  // 八正格：正官、七杀、正财、偏财、食神、伤官、正印、偏印
  const standardGe = {
    "正官": "正官格", "七杀": "七杀格（偏官格）",
    "正财": "正财格", "偏财": "偏财格",
    "食神": "食神格", "伤官": "伤官格",
    "正印": "正印格", "偏印": "偏印格（倒食格）"
  };

  return standardGe[mainShiShen] || `${mainShiShen}格`;
}

// 排十年大运
function calculateDaYun(pillars, gender = "男", birthYear = 2000) {
  // 阳男阴女顺排，阴男阳女逆排
  // 年干阴阳
  const yearYinYang = rules.tiangan[pillars.yearGan]?.yin_yang || "阳";
  const isForward = (gender === "男" && yearYinYang === "阳") || (gender === "女" && yearYinYang === "阴");

  const startMonthGanIndex = TIANGAN.indexOf(pillars.monthGan);
  const startMonthZhiIndex = DIZHI.indexOf(pillars.monthZhi);

  const dayunList = [];
  const startAge = 6; // 平均起运虚岁约 6-8 岁

  for (let i = 1; i <= 8; i++) {
    const step = isForward ? i : -i;
    const ganIdx = (startMonthGanIndex + step + 120) % 10;
    const zhiIdx = (startMonthZhiIndex + step + 120) % 12;
    const gan = TIANGAN[ganIdx];
    const zhi = DIZHI[zhiIdx];
    const pillar = gan + zhi;
    const ageStart = startAge + (i - 1) * 10;
    const ageEnd = ageStart + 9;
    const yearStart = birthYear + ageStart;

    dayunList.push({
      step: i,
      pillar,
      gan,
      zhi,
      shishen: getShiShen(pillars.dayGan, gan),
      nayin: rules.nayin[pillar] || "金箔金",
      ageRange: `${ageStart}-${ageEnd}岁`,
      yearRange: `${yearStart}-${yearStart + 9}年`
    });
  }

  return { isForward, dayunList, startAge };
}

// 计算四柱十二长生
function calculateChangSheng(dayGan, yearZhi, monthZhi, dayZhi, hourZhi) {
  const ganMap = rules.shier_changsheng?.tiangan_stages?.[dayGan] || {};
  return {
    year: { stage: ganMap[yearZhi] || "-", desc: rules.shier_changsheng?.stages?.[ganMap[yearZhi]] || "" },
    month: { stage: ganMap[monthZhi] || "-", desc: rules.shier_changsheng?.stages?.[ganMap[monthZhi]] || "" },
    day: { stage: ganMap[dayZhi] || "-", desc: rules.shier_changsheng?.stages?.[ganMap[dayZhi]] || "" },
    hour: { stage: ganMap[hourZhi] || "-", desc: rules.shier_changsheng?.stages?.[ganMap[hourZhi]] || "" }
  };
}

// 综合完整排盘主入口
function fullBaZiChart(input) {
  const pillars = calculateBaZiPillars(input, input.cityName || "北京");
  const gender = input.gender || "男";
  const birthYear = parseInt(input.year || 2000);

  // 四柱纳音
  const yearNayin = rules.nayin[pillars.yearPillar] || "";
  const monthNayin = rules.nayin[pillars.monthPillar] || "";
  const dayNayin = rules.nayin[pillars.dayPillar] || "";
  const hourNayin = rules.nayin[pillars.hourPillar] || "";

  // 十二长生
  const changsheng = calculateChangSheng(pillars.dayGan, pillars.yearZhi, pillars.monthZhi, pillars.dayZhi, pillars.hourZhi);

  // 天干十神
  const yearGanShishen = getShiShen(pillars.dayGan, pillars.yearGan);
  const monthGanShishen = getShiShen(pillars.dayGan, pillars.monthGan);
  const hourGanShishen = getShiShen(pillars.dayGan, pillars.hourGan);

  // 地支藏干
  const yearCangGan = getBranchCangGan(pillars.dayGan, pillars.yearZhi);
  const monthCangGan = getBranchCangGan(pillars.dayGan, pillars.monthZhi);
  const dayCangGan = getBranchCangGan(pillars.dayGan, pillars.dayZhi);
  const hourCangGan = getBranchCangGan(pillars.dayGan, pillars.hourZhi);

  // 神煞
  const allZhis = [pillars.yearZhi, pillars.monthZhi, pillars.dayZhi, pillars.hourZhi];
  const shenshas = calculateShenSha(pillars.dayGan, pillars.dayZhi, pillars.yearGan, pillars.yearZhi, allZhis);

  // 五行能量
  const elements = calculateElementsScore(pillars);

  // 格局
  const geju = determineGeJu(pillars.dayGan, pillars.monthZhi, pillars);

  // 大运
  const dayun = calculateDaYun(pillars, gender, birthYear);

  return {
    ...pillars,
    gender,
    birthYear,
    dayMasterInfo: rules.tiangan[pillars.dayGan],
    yearNayin, monthNayin, dayNayin, hourNayin,
    changsheng,
    shishen: {
      yearGan: yearGanShishen,
      monthGan: monthGanShishen,
      dayGan: "日主元神",
      hourGan: hourGanShishen
    },
    canggan: {
      year: yearCangGan,
      month: monthCangGan,
      day: dayCangGan,
      hour: hourCangGan
    },
    shenshas,
    elements,
    geju,
    dayun
  };
}

module.exports = {
  getShiShen,
  getBranchCangGan,
  calculateShenSha,
  calculateElementsScore,
  determineGeJu,
  calculateDaYun,
  fullBaZiChart
};
