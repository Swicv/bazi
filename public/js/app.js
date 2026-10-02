/**
 * 灵境玄机阁 前端主应用逻辑
 */

// 全局状态
const state = {
  currentChart: null,
  currentReport: null,
  isVip: localStorage.getItem("lingjing_vip") === "true",
  cities: []
};

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initCities();
  initForm();
  initVipStatus();
  initChat();
  
  // 默认自动触发一次经典测试案例排盘
  loadSampleCase();
});

// 初始化城市列表
async function initCities() {
  const citySelect = document.getElementById("input-city");
  try {
    const res = await fetch("/api/cities");
    const data = await res.json();
    state.cities = data.cities;
    citySelect.innerHTML = "";
    data.cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.innerText = c;
      if (c === "北京") opt.selected = true;
      citySelect.appendChild(opt);
    });
  } catch (err) {
    citySelect.innerHTML = `<option value="北京">北京 (116.4°E)</option>`;
  }
}

// 标签页切换
function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.style.display = "none");

      btn.classList.add("active");
      const targetPane = document.getElementById(`pane-${target}`);
      if (targetPane) targetPane.style.display = "block";

      if (target === "library") {
        window.initLibrary?.();
      }
    });
  });
}

// 快速载入预设案例
function loadSampleCase() {
  document.getElementById("input-year").value = "1995";
  document.getElementById("input-month").value = "10";
  document.getElementById("input-day").value = "24";
  document.getElementById("input-hour").value = "14";
  document.getElementById("input-minute").value = "30";
  document.getElementById("input-gender").value = "男";
  document.getElementById("input-city").value = "北京";

  calculateBaZi();
}

// 表单提交排盘
function initForm() {
  const form = document.getElementById("bazi-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculateBaZi();
  });
}

// 发起排盘请求
async function calculateBaZi() {
  const submitBtn = document.getElementById("btn-submit-bazi");
  submitBtn.disabled = true;
  submitBtn.innerText = "精密演算推演中...";

  const payload = {
    year: document.getElementById("input-year").value,
    month: document.getElementById("input-month").value,
    day: document.getElementById("input-day").value,
    hour: document.getElementById("input-hour").value,
    minute: document.getElementById("input-minute").value,
    gender: document.getElementById("input-gender").value,
    cityName: document.getElementById("input-city").value
  };

  try {
    const res = await fetch("/api/bazi/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      alert("排盘失败: " + (data.error || "未知原因"));
      return;
    }

    state.currentChart = data.chart;
    state.currentReport = data.report;

    renderBaZiResult(data.chart, data.report);
  } catch (err) {
    alert("网络连接异常，请检查本地服务");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "🔮 开启周易八字测算";
  }
}

// 渲染排盘与报告全景
function renderBaZiResult(chart, report) {
  const board = document.getElementById("bazi-result-board");
  board.style.display = "block";

  // 1. 真太阳时与基准
  document.getElementById("res-solar-time").innerText = chart.solarDate;
  document.getElementById("res-true-solar-time").innerText = `${chart.trueSolarDate} (经度时差校正 ${chart.timeAdjustment} 分钟)`;

  // 2. 四柱干支板
  renderPillar("year", chart.yearPillar, chart.shishen.yearGan, chart.yearNayin, chart.canggan.year);
  renderPillar("month", chart.monthPillar, chart.shishen.monthGan, chart.monthNayin, chart.canggan.month);
  renderPillar("day", chart.dayPillar, "日主元神", chart.dayNayin, chart.canggan.day);
  renderPillar("hour", chart.hourPillar, chart.shishen.hourGan, chart.hourNayin, chart.canggan.hour);

  // 3. 五行能量与日主强弱
  document.getElementById("res-strength-badge").innerText = `${chart.dayMasterInfo.name} · ${chart.elements.strengthLabel} (${chart.elements.strengthRatio}%)`;
  document.getElementById("res-geju-badge").innerText = chart.geju;

  const elemColors = { "木": "var(--elem-wood)", "火": "var(--elem-fire)", "土": "var(--elem-earth)", "金": "var(--elem-metal)", "水": "var(--elem-water)" };
  const elemBars = document.getElementById("elements-bars");
  elemBars.innerHTML = "";
  ["木", "火", "土", "金", "水"].forEach(elem => {
    const pct = chart.elements.percentages[elem] || 0;
    const row = document.createElement("div");
    row.className = "elem-bar-row";
    row.innerHTML = `
      <span class="elem-bar-label elem-${elem}">${elem} ${pct}%</span>
      <div class="elem-bar-track">
        <div class="elem-bar-fill" style="width: ${pct}%; background: ${elemColors[elem]};"></div>
      </div>
    `;
    elemBars.appendChild(row);
  });

  // 4. 神煞徽章
  const shenshaBox = document.getElementById("res-shensha-box");
  shenshaBox.innerHTML = "";
  chart.shenshas.forEach(s => {
    const tag = document.createElement("span");
    tag.className = "ancient-badge";
    tag.title = s.desc;
    tag.innerText = `★ ${s.name} (${s.zhi})`;
    shenshaBox.appendChild(tag);
  });

  // 5. 大运走势
  const dayunScroll = document.getElementById("dayun-scroll-container");
  dayunScroll.innerHTML = "";
  chart.dayun.dayunList.forEach(d => {
    const item = document.createElement("div");
    item.className = "dayun-item";
    item.innerHTML = `
      <div style="font-size: 11px; color: #94a3b8;">${d.ageRange}</div>
      <div style="font-size: 18px; font-weight: bold; margin: 4px 0; color: #fef08a;">${d.pillar}</div>
      <div style="font-size: 11px; color: #38bdf8;">${d.shishen}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${d.nayin}</div>
    `;
    dayunScroll.appendChild(item);
  });

  // 6. 古籍溯源展陈（重中之重）
  // 穷通宝鉴
  const qt = report.ancientBooks.qiongTong;
  document.getElementById("qt-source-title").innerText = `${qt.book} · 【${qt.stemMonth}】`;
  document.getElementById("qt-original-text").innerText = `“${qt.originalText}”`;
  document.getElementById("qt-modern-text").innerText = qt.modernExplanation;

  // 三命通会
  const sm = report.ancientBooks.sanMing;
  document.getElementById("sm-source-title").innerText = `${sm.book} · 【${sm.dayPillar}·${sm.title}】`;
  document.getElementById("sm-original-text").innerText = `“${sm.originalText}”`;
  document.getElementById("sm-modern-text").innerText = sm.modernExplanation;

  // 7. 多维细分报告
  // 核心性格
  const personUl = document.getElementById("report-personality-list");
  personUl.innerHTML = "";
  report.personality.forEach(p => {
    const li = document.createElement("li");
    li.style.marginBottom = "8px";
    li.innerText = p;
    personUl.appendChild(li);
  });

  // 事业与财富
  document.getElementById("report-career-industries").innerText = report.career.idealIndustries.join("、");
  document.getElementById("report-career-style").innerText = report.career.workStyle;
  document.getElementById("report-career-wealth").innerText = report.career.wealthPattern;
  document.getElementById("report-career-direction").innerText = report.career.favorableDirection;

  // 婚恋家庭
  document.getElementById("report-love-palace").innerText = report.marriage.spousePalace;
  document.getElementById("report-love-traits").innerText = report.marriage.idealPartnerTraits;
  document.getElementById("report-love-guidance").innerText = report.marriage.relationshipGuidance;

  // 五行健康养生
  const healthBox = document.getElementById("report-health-box");
  healthBox.innerHTML = "";
  report.health.forEach(h => {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";
    div.innerHTML = `<strong class="elem-${h.element}">【${h.element}行调和】</strong>：关注脏腑${h.organ}。${h.tip}`;
    healthBox.appendChild(div);
  });

  // 流年运势
  const yearsBox = document.getElementById("report-future-years");
  yearsBox.innerHTML = "";
  report.futureYears.forEach(y => {
    const yDiv = document.createElement("div");
    yDiv.style.background = "rgba(0,0,0,0.25)";
    yDiv.style.border = "1px solid rgba(245, 158, 11, 0.2)";
    yDiv.style.borderRadius = "10px";
    yDiv.style.padding = "12px";
    yDiv.style.marginBottom = "8px";
    yDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; color: #fef08a; font-weight: bold; margin-bottom: 4px;">
        <span>${y.year}年 · ${y.ganzhi}年 (${y.nayin})</span>
        <span style="color: #38bdf8; font-size: 13px;">${y.theme}</span>
      </div>
      <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">${y.detail}</p>
    `;
    yearsBox.appendChild(yDiv);
  });

  // 检查 VIP 遮罩状态
  updateVipUi();
}

function renderPillar(prefix, pillarStr, shishen, nayin, cangganList) {
  const gan = pillarStr.charAt(0);
  const zhi = pillarStr.charAt(1);

  document.getElementById(`p-${prefix}-shishen`).innerText = shishen;
  document.getElementById(`p-${prefix}-gan`).innerText = gan;
  document.getElementById(`p-${prefix}-zhi`).innerText = zhi;
  document.getElementById(`p-${prefix}-nayin`).innerText = nayin;

  const cgBox = document.getElementById(`p-${prefix}-canggan`);
  cgBox.innerHTML = cangganList.map(c => `<div>${c.name} (${c.shishen})</div>`).join("");
}

// VIP 状态管理
function initVipStatus() {
  const vipBtn = document.getElementById("nav-vip-btn");
  vipBtn.addEventListener("click", openVipModal);

  document.getElementById("btn-close-modal").addEventListener("click", closeVipModal);
  document.getElementById("btn-verify-key").addEventListener("click", verifyLicenseKey);
  document.getElementById("btn-quick-vip").addEventListener("click", () => {
    document.getElementById("input-license-key").value = "LINGJING-2026-VIP";
    verifyLicenseKey();
  });

  updateVipUi();
}

function updateVipUi() {
  const navVipBtn = document.getElementById("nav-vip-btn");
  const vipOverlay = document.getElementById("vip-lock-overlay");
  const vipContent = document.getElementById("vip-locked-content");

  if (state.isVip) {
    navVipBtn.innerHTML = "👑 尊享 VIP 已激活";
    navVipBtn.style.borderColor = "#10b981";
    navVipBtn.style.color = "#a7f3d0";
    if (vipOverlay) vipOverlay.style.display = "none";
    if (vipContent) vipContent.classList.remove("vip-blur-content");
  } else {
    navVipBtn.innerHTML = "💎 激活尊享 VIP";
    if (vipOverlay) vipOverlay.style.display = "flex";
    if (vipContent) vipContent.classList.add("vip-blur-content");
  }
}

function openVipModal() {
  document.getElementById("vip-modal").classList.add("active");
}

function closeVipModal() {
  document.getElementById("vip-modal").classList.remove("active");
}

async function verifyLicenseKey() {
  const keyInput = document.getElementById("input-license-key");
  const licenseKey = keyInput.value.trim();
  if (!licenseKey) {
    alert("请输入卡密序列号");
    return;
  }

  try {
    const res = await fetch("/api/vip/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey })
    });
    const data = await res.json();

    if (data.success) {
      state.isVip = true;
      localStorage.setItem("lingjing_vip", "true");
      alert("🎉 " + data.message);
      closeVipModal();
      updateVipUi();
    } else {
      alert("激活失败：" + data.message);
    }
  } catch (err) {
    alert("核销请求异常，请检查网络");
  }
}

// AI 智能顾问流式问答
function initChat() {
  const sendBtn = document.getElementById("chat-send-btn");
  const input = document.getElementById("chat-input");

  sendBtn.addEventListener("click", () => sendChatMessage());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  // 快捷问题标签
  document.querySelectorAll(".quick-q-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      input.value = btn.innerText;
      sendChatMessage();
    });
  });
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const question = input.value.trim();
  if (!question) return;

  if (!state.currentChart) {
    alert("请先在上方的“八字精算”中生成命盘，以便 AI 宗师为您按盘推演！");
    return;
  }

  input.value = "";
  appendChatBubble("user", question);

  const assistantBubble = appendChatBubble("assistant", "正在结合《三命通会》与《穷通宝鉴》易理沉思推演中...");

  try {
    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        chart: state.currentChart,
        report: state.currentReport
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let aiText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(6).trim();
          if (content === "[DONE]") break;
          try {
            const parsed = JSON.parse(content);
            if (parsed.text) {
              aiText += parsed.text;
              assistantBubble.innerText = aiText;
            } else if (parsed.choices?.[0]?.delta?.content) {
              aiText += parsed.choices[0].delta.content;
              assistantBubble.innerText = aiText;
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    assistantBubble.innerText = "抱歉，玄机推演发生异常，请重试。";
  }
}

function appendChatBubble(role, text) {
  const container = document.getElementById("chat-messages-container");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.innerText = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

// 打印导出 PDF
function exportReportPdf() {
  if (!state.isVip) {
    openVipModal();
    return;
  }
  window.print();
}

window.exportReportPdf = exportReportPdf;
window.loadSampleCase = loadSampleCase;
