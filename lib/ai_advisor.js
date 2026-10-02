/**
 * 灵境玄机 AI 智能解盘与国学宗师顾问模块
 * 支持：
 * 1. 外部大模型 API（兼容 OpenAI / DeepSeek / 通义千问等，支持流式 SSE）
 * 2. 内置高质量离线易理启发式推理引擎（零外部网络依赖，结合命局特征与古籍深度对答）
 */

const https = require("https");
const http = require("http");

// 专家级离线启发式回复生成器
function generateHeuristicResponse(question, chart, report) {
  const q = (question || "").toLowerCase();
  const dayGan = chart.dayGan;
  const dayMaster = chart.dayMasterInfo.name;
  const geju = chart.geju;
  const favorable = report.elementsAnalysis.favorableElements.join("、");
  const strongest = report.elementsAnalysis.strongestElem;

  let topic = "综合运势";
  let analysis = "";

  if (q.includes("工作") || q.includes("跳槽") || q.includes("事业") || q.includes("升职") || q.includes("创业")) {
    topic = "事业职场与行业抉择";
    analysis = `
从你的命局格局【${geju}】与日元【${dayMaster}】来看：
1. **天赋与职场定位**：你天生具备【${chart.dayMasterInfo.nature}】特质。命局能量属于【${chart.elements.strengthLabel}】。这意味着你在处理复杂业务时具备沉稳扎实的推进力。
2. **喜用五行行业**：最利于你的五行属性为【${favorable}】。适宜行业如：${report.career.idealIndustries.join("、")}。
3. **关键决策建议**：若面临跳槽或开拓新赛道，古籍《滴天髓》云“顺应天机，因时取势”。建议重点关注具备长期积累价值的平台，避免因一时短期利益而频繁转向。在团队协作中，适度发挥你的规划与协调特长，必能脱颖而出。`;
  } else if (q.includes("感情") || q.includes("婚") || q.includes("恋爱") || q.includes("对象") || q.includes("桃花")) {
    topic = "情感婚恋与人际契合";
    analysis = `
根据你的日柱【${chart.dayPillar}】及《三命通会》日支考辨：
1. **夫妻宫象意**：${report.marriage.spousePalace}。这意味着你未来的伴侣多具有温和理智、注重家庭责任的特征。
2. **情感互动盲区**：命局中【${strongest}】气较为显赫，在亲密沟通中有时容易表现出较强的原则感或内敛情绪。
3. **增运契机**：多增加包容与共情维度的表达。当遇到意见分歧时，不妨以柔克刚，以倾听代替说服。遇到喜用五行【${favorable}】特质明显的伴侣，彼此能在生活与事业上形成极佳的互补。`;
  } else if (q.includes("财") || q.includes("投资") || q.includes("理财") || q.includes("买房") || q.includes("赚")) {
    topic = "财富格局与资产配置";
    analysis = `
依据八字十神配置与《穷通宝鉴》财气调候：
1. **求财模式**：${report.career.wealthPattern}。
2. **吉利方位与时机**：求财吉利方向为【${report.career.favorableDirection}】。
3. **财运忠告**：古籍强调“财有源流，不涸不溢”。你的财富增长更偏向于“厚积薄发、稳健滚雪球”，切忌被高杠杆或虚妄的快钱投机所诱导。守住主业基本盘，辅以稳健的长线资产配置，方为安身立命之大道。`;
  } else if (q.includes("考") || q.includes("学") || q.includes("读书") || q.includes("上岸") || q.includes("考研") || q.includes("考公")) {
    topic = "学业考运与功名进阶";
    analysis = `
从文昌神煞与印星考量：
1. **考运加持**：命盘中包含神煞【${chart.shenshas.map(s => s.name).join("、") || "文昌贵人"}】，天生带有钻研思辨与文化领悟灵性。
2. **复习备考心法**：你的逻辑思维胜于死记硬背。建议采用结构化思维导图与输出倒逼输入的复习法。
3. **心态调和**：临考前最忌思虑繁杂引发情绪起伏。保持清淡饮食，考前规律作息，必能超常发挥，金榜题名。`;
  } else {
    topic = "命理玄机与人生锦囊";
    analysis = `
结合你的四柱八字【${chart.yearPillar} ${chart.monthPillar} ${chart.dayPillar} ${chart.hourPillar}】：
1. **天地气象**：你生于【${chart.monthZhi}】月，日主为【${dayMaster}】。《穷通宝鉴》评注：“${report.ancientBooks.qiongTong.originalText}”。
2. **人生宏观建议**：当前大运与命局相辅相成，处事贵在“知己之长，避己之短”。多亲近【${favorable}】属性之人和事，修心养性，顺势而为，人生自会常履平川。`;
  }

  return `【灵境玄机阁·国学顾问研判】\n\n关于您垂询的**${topic}**，易学解盘如下：\n${analysis}\n\n*（易经云：天行健，君子以自强不息。命数揭示趋势与禀赋，生活始终由您的智慧与行动创造。）*`;
}

// 统一的对话流式分发器
async function streamAdvice(reqBody, res) {
  const { question, chart, report } = reqBody;
  const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "https://api.deepseek.com/v1";

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 若无外部 API KEY，直接使用内置专家级启发式引擎进行流式输出
  if (!apiKey) {
    const fullText = generateHeuristicResponse(question, chart, report);
    const chunks = fullText.split("\n");
    
    for (let i = 0; i < chunks.length; i++) {
      const line = chunks[i];
      res.write(`data: ${JSON.stringify({ text: line + (i < chunks.length - 1 ? "\n" : "") })}\n\n`);
      await new Promise(r => setTimeout(r, 60)); // 模拟思考打字微延迟
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  // 若配置了外部大模型 API
  const systemPrompt = `你是一位精通中国传统易经八字、四柱命理学并融合现代积极心理学的高级国学顾问。
用户八字：${chart.yearPillar} ${chart.monthPillar} ${chart.dayPillar} ${chart.hourPillar}
日主：${chart.dayMasterInfo.name}，格局：${chart.geju}
《穷通宝鉴》调候批注：${report.ancientBooks.qiongTong.originalText}
《三命通会》日柱断语：${report.ancientBooks.sanMing.originalText}
五行喜用神：${report.elementsAnalysis.favorableElements.join("、")}

请严格遵守以下原则：
1. 态度端正、温雅慈祥、引经据典，兼具现代建设性心理指导；
2. 坚决破除封建恐吓性迷信，严禁使用“早夭、克夫、大难临头”等引发焦虑的词汇，重在指导扬长避短、启发心智；
3. 回答排版规范、结构清晰、逻辑严谨。`;

  try {
    const postData = JSON.stringify({
      model: process.env.AI_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      stream: true
    });

    const urlObj = new URL(`${apiBase}/chat/completions`);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const client = urlObj.protocol === "https:" ? https : http;
    const proxyReq = client.request(options, (proxyRes) => {
      proxyRes.on("data", (chunk) => {
        res.write(chunk);
      });
      proxyRes.on("end", () => {
        res.end();
      });
    });

    proxyReq.on("error", (err) => {
      // 降级为离线引擎
      const fallback = generateHeuristicResponse(question, chart, report);
      res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    });

    proxyReq.write(postData);
    proxyReq.end();
  } catch (e) {
    const fallback = generateHeuristicResponse(question, chart, report);
    res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}

module.exports = {
  generateHeuristicResponse,
  streamAdvice
};
