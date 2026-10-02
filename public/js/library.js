/**
 * 古籍藏经阁典籍检索与阅读模块
 */

let libraryData = null;

async function initLibrary() {
  const container = document.getElementById("library-container");
  if (libraryData) return;

  try {
    const res = await fetch("/api/library");
    libraryData = await res.json();
    renderLibrary(libraryData);
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444;">古籍文献加载失败，请刷新重试</p>`;
  }
}

function renderLibrary(data) {
  const container = document.getElementById("library-container");
  container.innerHTML = "";

  data.categories.forEach(cat => {
    const catSection = document.createElement("div");
    catSection.className = "glass-card";
    catSection.style.marginBottom = "20px";

    let booksHtml = "";
    cat.books.forEach(b => {
      let chaptersHtml = "";
      b.chapters.forEach(ch => {
        chaptersHtml += `
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-top: 10px;">
            <h5 style="color: #fef08a; font-size: 14px; margin-bottom: 6px;">${ch.title}</h5>
            <p style="font-size: 13px; color: #cbd5e1; line-height: 1.7; font-family: 'Songti SC', serif;">${ch.content}</p>
          </div>
        `;
      });

      booksHtml += `
        <div class="ancient-book-card" style="margin-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="font-size: 16px; color: #f59e0b;">${b.title}</h4>
            <span style="font-size: 12px; color: #94a3b8;">${b.dynasty} · ${b.author}</span>
          </div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 10px;">${b.summary}</p>
          <div style="margin-top: 10px;">
            <strong style="font-size: 12px; color: #e2e8f0; letter-spacing: 1px;">【精选篇章诵读】</strong>
            ${chaptersHtml}
          </div>
        </div>
      `;
    });

    catSection.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">📖 ${cat.name}</h3>
      </div>
      <div>${booksHtml}</div>
    `;

    container.appendChild(catSection);
  });
}

window.initLibrary = initLibrary;
