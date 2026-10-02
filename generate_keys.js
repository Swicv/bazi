/**
 * 卡密批量生成与发卡导出工具 (CLI 命令行脚本)
 * 使用方法:
 *   node generate_keys.js [数量] [前缀]
 * 示例:
 *   node generate_keys.js 10 TIANJI
 *   node generate_keys.js 50 FAKA
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const args = process.argv.slice(2);
const count = parseInt(args[0], 10) || 10;
const prefix = (args[1] || "FAKA").toUpperCase();

const keyFile = path.join(__dirname, "data/license_keys.json");
const keyData = fs.existsSync(keyFile) 
  ? JSON.parse(fs.readFileSync(keyFile, "utf-8"))
  : { system_config: { vip_price: 68.0, vip_perks: [] }, keys: {} };

// 生成随机 4 位字符块
function randomChunk(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 排除易混淆字符 0, O, 1, I
  let res = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    res += chars[bytes[i] % chars.length];
  }
  return res;
}

// 生成单个卡密 (格式: PREFIX-XXXX-XXXX-XXXX)
function generateSingleKey(p) {
  return `${p}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
}

const newKeys = [];
const today = new Date().toISOString().slice(0, 10);

for (let i = 0; i < count; i++) {
  let key = generateSingleKey(prefix);
  while (keyData.keys[key]) {
    key = generateSingleKey(prefix);
  }
  keyData.keys[key] = {
    type: "permanent_vip",
    created_at: today,
    used: false,
    used_at: null
  };
  newKeys.push(key);
}

// 写回数据库
fs.writeFileSync(keyFile, JSON.stringify(keyData, null, 2), "utf-8");

// 同时生成一份可直接导入发卡网的纯文本文件
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const exportTxtFile = path.join(__dirname, `data/export_keys_${prefix}_${timestamp}.txt`);
fs.writeFileSync(exportTxtFile, newKeys.join("\n") + "\n", "utf-8");

console.log("==================================================");
console.log(`🎉 成功批量生成 ${count} 张全新 VIP 卡密！`);
console.log(`📌 数据库已更新: data/license_keys.json`);
console.log(`📄 发卡网导入文本已生成: ${path.relative(__dirname, exportTxtFile)}`);
console.log("==================================================");
console.log("卡密明细 (可直接复制):");
newKeys.forEach((k, idx) => {
  console.log(`  [${String(idx + 1).padStart(2, "0")}] ${k}`);
});
console.log("==================================================");
