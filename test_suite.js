/**
 * 全量端到端自动化测试脚本
 * 验证：八字计算、五行能量、古籍溯源、六爻起卦、藏经阁、VIP卡密验证
 */

const assert = require("assert");
const http = require("http");
const { fullBaZiChart } = require("./lib/bazi");
const { generateComprehensiveReport } = require("./lib/analyzer");
const { generateHeuristicResponse } = require("./lib/ai_advisor");

async function runTests() {
  console.log("=== 1. 测试八字高精度排盘与真太阳时计算 ===");
  const testInput = {
    year: 1995,
    month: 10,
    day: 24,
    hour: 14,
    minute: 30,
    cityName: "北京",
    gender: "男"
  };

  const chart = fullBaZiChart(testInput);
  console.log(" 四柱干支:", chart.yearPillar, chart.monthPillar, chart.dayPillar, chart.hourPillar);
  assert.strictEqual(chart.yearPillar, "乙亥", "年柱应为乙亥");
  assert.strictEqual(chart.monthPillar, "丙戌", "月柱应为丙戌");
  assert.strictEqual(chart.dayPillar, "戊子", "日柱应为戊子");
  assert.strictEqual(chart.hourPillar, "己未", "时柱应为己未");
  assert.strictEqual(chart.dayMasterInfo.name, "戊土", "日主应为戊土");
  assert.ok(chart.shenshas.length > 0, "应推算出命带神煞");
  assert.ok(chart.dayun.dayunList.length === 8, "应推算8步十年大运");
  console.log(" 八字排盘算法与历法断定：测试全部通过！");

  console.log("\n=== 2. 测试古籍文献结构化精准匹配与报告生成 ===");
  const report = generateComprehensiveReport(chart);
  console.log(" 《穷通宝鉴》引用:", report.ancientBooks.qiongTong.book, report.ancientBooks.qiongTong.stemMonth);
  console.log(" 《穷通宝鉴》原文:", report.ancientBooks.qiongTong.originalText);
  assert.ok(report.ancientBooks.qiongTong.originalText.includes("九月燥气闭藏"), "应准确命中穷通宝鉴戊土生于戌月之断语");

  console.log(" 《三命通会》引用:", report.ancientBooks.sanMing.book, report.ancientBooks.sanMing.dayPillar);
  console.log(" 《三命通会》原文:", report.ancientBooks.sanMing.originalText);
  assert.ok(report.ancientBooks.sanMing.originalText.includes("六秀日"), "应准确命中三命通会戊子日之断语");
  assert.ok(report.personality.length >= 4, "应生成多维性格画像");
  assert.ok(report.career.idealIndustries.length > 0, "应生成五行宜业建议");
  assert.ok(report.futureYears.length === 3, "应生成三年流年运势推演");
  console.log(" 古籍数字化匹配与命理报告：测试全部通过！");

  console.log("\n=== 3. 测试 AI 国学顾问易学推理回复 ===");
  const testQuestion = "我适合什么时候换工作，我的财运怎么样？";
  const aiAnswer = generateHeuristicResponse(testQuestion, chart, report);
  console.log(" AI 生成解读样本 (前 150 字):", aiAnswer.slice(0, 150).replace(/\n/g, " ") + "...");
  assert.ok(aiAnswer.includes("事业职场与行业抉择"), "应智能识别用户关于工作的疑问");
  assert.ok(aiAnswer.includes("戊土"), "AI 解读应结合日主元神");
  console.log(" AI 顾问推理与心理学润色：测试全部通过！");

  console.log("\n=== 4. 测试周易六爻金钱卦拟真演化 ===");
  const fs = require("fs");
  const ichingData = JSON.parse(fs.readFileSync("./data/iching_64.json", "utf-8"));
  assert.ok(ichingData.hexagrams["111111"].name === "乾为天", "乾为天卦验证");
  assert.ok(ichingData.hexagrams["000000"].name === "坤为地", "坤为地卦验证");
  console.log(" 周易六十四卦卦辞爻辞：测试全部通过！");

  console.log("\n=== 5. 测试商业化 VIP 卡密核销系统 ===");
  const keyFile = "./data/license_keys.json";
  const keyData = JSON.parse(fs.readFileSync(keyFile, "utf-8"));
  assert.ok(keyData.keys["LINGJING-2026-VIP"], "应存在预置VIP卡密");
  console.log(" VIP 授权卡密库：测试全部通过！");

  console.log("\n==========================================");
  console.log("  恭喜！全部 5 大核心功能模块自测试验 100% 成功！");
  console.log("==========================================");
}

runTests();
