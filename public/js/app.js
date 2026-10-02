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
  
  // 默认自动触发一次经典测试案例排盘
  loadSampleCase();
});

// 初始化省市二级联动与真太阳时城市体系
function initCities() {
  const provinceSelect = document.getElementById("input-province");
  const citySelect = document.getElementById("input-city");
  const searchInput = document.getElementById("city-search");
  const solarBadge = document.getElementById("city-solar-badge");
  const quickTags = document.querySelectorAll(".city-quick-tag");

  const provinces = window.CHINA_PROVINCES || [];
  const longitudes = window.CITY_LONGITUDES || {};

  // 1. 填充省份下拉框
  if (provinceSelect) {
    provinceSelect.innerHTML = "";
    provinces.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.province;
      opt.innerText = p.province;
      if (p.province === "直辖市") opt.selected = true;
      provinceSelect.appendChild(opt);
    });
  }

  // 2. 根据选中的省份填充城市下拉框
  function updateCitiesForProvince(provName, selectCityName = null) {
    const pData = provinces.find(p => p.province === provName) || provinces[0];
    if (citySelect) {
      citySelect.innerHTML = "";
      if (pData && pData.cities) {
        pData.cities.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.name;
          opt.innerText = `${c.name} (${c.lon}°E)`;
          if (selectCityName && c.name === selectCityName) {
            opt.selected = true;
          } else if (!selectCityName && c.name === "北京") {
            opt.selected = true;
          }
          citySelect.appendChild(opt);
        });
      }
    }
    updateSolarBadge();
  }

  // 3. 更新真太阳时提示徽章
  function updateSolarBadge() {
    const curProv = provinceSelect ? provinceSelect.value : "直辖市";
    const curCity = citySelect ? citySelect.value : "北京";
    const lon = longitudes[curCity] || 120.0;
    const diff = Math.round((lon - 120.0) * 4 * 10) / 10;
    let diffText = "";
    if (diff > 0) {
      diffText = `真太阳时较北京时间快约 ${diff} 分钟`;
    } else if (diff < 0) {
      diffText = `真太阳时较北京时间慢约 ${Math.abs(diff)} 分钟`;
    } else {
      diffText = "真太阳时与北京时间基本一致";
    }

    if (solarBadge) {
      solarBadge.innerHTML = `📍 ${curProv} · ${curCity} (${lon}°E) | ${diffText}`;
    }

    // 同步高亮快捷标签
    quickTags.forEach(tag => {
      if (tag.dataset.city === curCity) {
        tag.classList.add("active");
      } else {
        tag.classList.remove("active");
      }
    });
  }

  // 省份切换监听
  if (provinceSelect) {
    provinceSelect.addEventListener("change", () => {
      updateCitiesForProvince(provinceSelect.value);
    });
  }

  // 城市切换监听
  if (citySelect) {
    citySelect.addEventListener("change", () => {
      updateSolarBadge();
    });
  }

  // 快捷标签点击监听
  quickTags.forEach(tag => {
    tag.addEventListener("click", () => {
      const p = tag.dataset.province;
      const c = tag.dataset.city;
      selectCityByName(c, p);
    });
  });

  // 搜索框实时过滤匹配
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) return;

      for (const p of provinces) {
        for (const c of p.cities) {
          if (c.name.includes(query) || (query.length >= 2 && p.province.includes(query))) {
            selectCityByName(c.name, p.province);
            return;
          }
        }
      }
    });
  }

  // 默认初始化直辖市·北京
  updateCitiesForProvince("直辖市", "北京");
}

// 通过城市名精确定位并联动选择
function selectCityByName(cityName, provinceName = null) {
  const provinceSelect = document.getElementById("input-province");
  const citySelect = document.getElementById("input-city");
  const provinces = window.CHINA_PROVINCES || [];

  let targetProv = provinceName;
  if (!targetProv) {
    for (const p of provinces) {
      if (p.cities.some(c => c.name === cityName)) {
        targetProv = p.province;
        break;
      }
    }
  }

  if (targetProv && provinceSelect) {
    provinceSelect.value = targetProv;
    const pData = provinces.find(p => p.province === targetProv);
    if (pData && citySelect) {
      citySelect.innerHTML = "";
      pData.cities.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.name;
        opt.innerText = `${c.name} (${c.lon}°E)`;
        if (c.name === cityName) opt.selected = true;
        citySelect.appendChild(opt);
      });
      citySelect.value = cityName;
    }
  } else if (citySelect) {
    citySelect.value = cityName;
  }

  // 触发一次更新徽章
  const solarBadge = document.getElementById("city-solar-badge");
  const longitudes = window.CITY_LONGITUDES || {};
  const lon = longitudes[cityName] || 120.0;
  const diff = Math.round((lon - 120.0) * 4 * 10) / 10;
  let diffText = diff > 0 ? `快约 ${diff} 分钟` : (diff < 0 ? `慢约 ${Math.abs(diff)} 分钟` : "一致");
  if (solarBadge) {
    solarBadge.innerHTML = `📍 ${targetProv || ""} · ${cityName} (${lon}°E) | 真太阳时较北京时间${diffText}`;
  }

  // 快捷标签高亮
  document.querySelectorAll(".city-quick-tag").forEach(tag => {
    if (tag.dataset.city === cityName) {
      tag.classList.add("active");
    } else {
      tag.classList.remove("active");
    }
  });
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
  selectCityByName("北京", "直辖市");

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
    cityName: (document.getElementById("input-city") && document.getElementById("input-city").value) || "北京"
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

  // 子平真诠
  const zp = report.ancientBooks.ziping;
  if (zp) {
    document.getElementById("zp-source-title").innerText = `${zp.book} · 【${zp.geju}】`;
    document.getElementById("zp-original-text").innerText = `“${zp.originalText}”`;
    document.getElementById("zp-modern-text").innerText = zp.modernExplanation;
  }

  // 滴天髓
  const dt = report.ancientBooks.diTianSui;
  if (dt) {
    document.getElementById("dt-source-title").innerText = `${dt.book} · 【${dt.section}】`;
    document.getElementById("dt-original-text").innerText = `“${dt.originalText}”`;
    document.getElementById("dt-modern-text").innerText = dt.modernExplanation;
  }

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
