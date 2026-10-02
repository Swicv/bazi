/**
 * 周易六爻金钱卦拟真摇卦模块
 */

let currentIChingState = {
  isShaking: false,
  completed: false,
  result: null
};

// 触发摇卦动画与接口请求
async function startShakeCoin() {
  if (currentIChingState.isShaking) return;
  
  const shakeBtn = document.getElementById("iching-shake-btn");
  const coins = [
    document.getElementById("coin-1"),
    document.getElementById("coin-2"),
    document.getElementById("coin-3")
  ];
  const stageStatus = document.getElementById("iching-stage-status");
  const resultCard = document.getElementById("iching-result-card");

  currentIChingState.isShaking = true;
  shakeBtn.disabled = true;
  shakeBtn.innerText = "六爻感应演化中...";
  stageStatus.innerText = "神明听知，卦象显现...";

  // 播放翻滚动画
  coins.forEach(c => c.classList.add("flipping"));

  try {
    const res = await fetch("/api/iching/shake");
    const data = await res.json();

    setTimeout(() => {
      coins.forEach(c => c.classList.remove("flipping"));
      currentIChingState.isShaking = false;
      currentIChingState.completed = true;
      currentIChingState.result = data;

      shakeBtn.disabled = false;
      shakeBtn.innerText = "重摇新卦";
      stageStatus.innerText = "六爻排定，吉凶见矣";

      renderIChingResult(data);
    }, 1200);

  } catch (err) {
    coins.forEach(c => c.classList.remove("flipping"));
    currentIChingState.isShaking = false;
    shakeBtn.disabled = false;
    shakeBtn.innerText = "重新起卦";
    stageStatus.innerText = "网络异常，请重试";
  }
}

// 渲染卦象结果
function renderIChingResult(data) {
  const resultCard = document.getElementById("iching-result-card");
  resultCard.style.display = "block";

  // 渲染爻线
  const linesContainer = document.getElementById("iching-lines-board");
  linesContainer.innerHTML = "";

  data.lines.forEach(l => {
    const lineRow = document.createElement("div");
    lineRow.className = "hex-line";

    if (l.isYang === 1) {
      lineRow.innerHTML = `<div class="hex-solid" title="${l.lineType}"></div>`;
    } else {
      lineRow.innerHTML = `
        <div class="hex-broken-left" title="${l.lineType}"></div>
        <div class="hex-broken-right" title="${l.lineType}"></div>
      `;
    }
    linesContainer.appendChild(lineRow);
  });

  // 渲染卦名与辞义
  const origin = data.origin;
  document.getElementById("iching-hex-name").innerText = `第 ${origin.number} 卦 · ${origin.name}`;
  document.getElementById("iching-judgment").innerText = `【卦辞】：${origin.judgment}`;
  document.getElementById("iching-image").innerText = `【大象】：${origin.image}`;
  document.getElementById("iching-meaning").innerText = `【气象格局】：${origin.meaning}`;
  document.getElementById("iching-guidance").innerText = `【现代决策契机】：${origin.guidance}`;

  // 变卦处理
  const targetArea = document.getElementById("iching-target-area");
  if (data.hasChange && data.target) {
    targetArea.style.display = "block";
    targetArea.innerHTML = `
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(245, 158, 11, 0.3);">
        <span class="ancient-badge">变卦趋向：第 ${data.target.number} 卦 · ${data.target.name}</span>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">【转进启示】：${data.target.guidance}</p>
      </div>
    `;
  } else {
    targetArea.style.display = "none";
  }

  resultCard.scrollIntoView({ behavior: "smooth" });
}

window.startShakeCoin = startShakeCoin;
