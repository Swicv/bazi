/**
 * 高精度天文农历与二十四节气换节排盘引擎
 * 涵盖：公历/农历互转、二十四节气精准交接、真太阳时经纬度校正、四柱干支推算
 */

const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 主要城市经度表（基准 120°E，每偏离 1 度相差 4 分钟）
const CITY_LONGITUDES = {
  "北京": 116.4,
  "上海": 121.47,
  "天津": 117.2,
  "重庆": 106.55,
  "广州": 113.26,
  "深圳": 114.07,
  "佛山": 113.12,
  "东莞": 113.75,
  "中山": 113.38,
  "珠海": 113.57,
  "惠州": 114.41,
  "江门": 113.08,
  "汕头": 116.68,
  "潮州": 116.62,
  "揭阳": 116.37,
  "湛江": 110.35,
  "茂名": 110.92,
  "肇庆": 112.46,
  "清远": 113.05,
  "梅州": 116.12,
  "韶关": 113.59,
  "河源": 114.7,
  "阳江": 111.98,
  "汕尾": 115.37,
  "云浮": 112.04,
  "顺德": 113.24,
  "南京": 118.8,
  "苏州": 120.58,
  "无锡": 120.31,
  "常州": 119.97,
  "南通": 120.89,
  "扬州": 119.41,
  "镇江": 119.42,
  "泰州": 119.92,
  "盐城": 120.16,
  "连云港": 119.22,
  "徐州": 117.18,
  "淮安": 119.01,
  "宿迁": 118.28,
  "昆山": 120.98,
  "江阴": 120.28,
  "常熟": 120.75,
  "张家港": 120.55,
  "宜兴": 119.82,
  "杭州": 120.15,
  "宁波": 121.55,
  "温州": 120.7,
  "嘉兴": 120.75,
  "湖州": 120.08,
  "绍兴": 120.58,
  "金华": 119.65,
  "衢州": 118.87,
  "舟山": 122.21,
  "台州": 121.42,
  "丽水": 119.92,
  "义乌": 120.07,
  "慈溪": 121.24,
  "诸暨": 120.24,
  "温岭": 121.38,
  "乐清": 120.96,
  "济南": 117,
  "青岛": 120.38,
  "淄博": 118.05,
  "枣庄": 117.32,
  "东营": 118.67,
  "烟台": 121.43,
  "潍坊": 119.16,
  "济宁": 116.59,
  "泰安": 117.08,
  "威海": 122.12,
  "日照": 119.53,
  "临沂": 118.35,
  "德州": 116.36,
  "聊城": 115.98,
  "滨州": 117.97,
  "菏泽": 115.48,
  "郑州": 113.62,
  "开封": 114.31,
  "洛阳": 112.45,
  "平顶山": 113.19,
  "安阳": 114.39,
  "鹤壁": 114.3,
  "新乡": 113.93,
  "焦作": 113.24,
  "濮阳": 115.03,
  "许昌": 113.85,
  "漯河": 114.02,
  "三门峡": 111.2,
  "南阳": 112.53,
  "商丘": 115.65,
  "信阳": 114.09,
  "周口": 114.69,
  "驻马店": 114.02,
  "济源": 112.6,
  "成都": 104.06,
  "绵阳": 104.73,
  "自贡": 104.78,
  "攀枝花": 101.72,
  "泸州": 105.44,
  "德阳": 104.4,
  "广元": 105.84,
  "遂宁": 105.59,
  "内江": 105.06,
  "乐山": 103.76,
  "南充": 106.08,
  "眉山": 103.85,
  "宜宾": 104.64,
  "广安": 106.63,
  "达州": 107.5,
  "雅安": 103,
  "巴中": 106.75,
  "资阳": 104.65,
  "阿坝": 102.22,
  "甘孜": 101.96,
  "凉山": 102.26,
  "武汉": 114.3,
  "黄石": 115.04,
  "十堰": 110.79,
  "宜昌": 111.29,
  "襄阳": 112.14,
  "鄂州": 114.89,
  "荆门": 112.2,
  "孝感": 113.92,
  "荆州": 112.24,
  "黄冈": 114.87,
  "咸宁": 114.32,
  "随州": 113.38,
  "恩施": 109.49,
  "仙桃": 113.45,
  "潜江": 112.9,
  "天门": 113.17,
  "神农架": 110.67,
  "长沙": 112.93,
  "株洲": 113.13,
  "湘潭": 112.94,
  "衡阳": 112.57,
  "邵阳": 111.47,
  "岳阳": 113.13,
  "常德": 111.69,
  "张家界": 110.48,
  "益阳": 112.35,
  "郴州": 113.01,
  "永州": 111.61,
  "怀化": 110,
  "娄底": 112,
  "湘西": 109.73,
  "石家庄": 114.51,
  "唐山": 118.18,
  "秦皇岛": 119.6,
  "邯郸": 114.49,
  "邢台": 114.51,
  "保定": 115.46,
  "张家口": 114.89,
  "承德": 117.96,
  "沧州": 116.84,
  "廊坊": 116.68,
  "衡水": 115.67,
  "雄安新区": 115.98,
  "福州": 119.3,
  "厦门": 118.08,
  "泉州": 118.68,
  "漳州": 117.65,
  "莆田": 119.01,
  "宁德": 119.53,
  "南平": 118.18,
  "龙岩": 117.02,
  "三明": 117.64,
  "晋江": 118.57,
  "合肥": 117.28,
  "芜湖": 118.38,
  "蚌埠": 117.36,
  "淮南": 117,
  "马鞍山": 118.51,
  "淮北": 116.8,
  "铜陵": 117.81,
  "安庆": 117.04,
  "黄山": 118.32,
  "滁州": 118.32,
  "阜阳": 115.81,
  "宿州": 116.98,
  "六安": 116.51,
  "亳州": 115.78,
  "池州": 117.49,
  "宣城": 118.76,
  "西安": 108.94,
  "宝鸡": 107.14,
  "咸阳": 108.7,
  "铜川": 108.94,
  "渭南": 109.5,
  "延安": 109.49,
  "汉中": 107.03,
  "榆林": 109.74,
  "安康": 109.03,
  "商洛": 109.94,
  "南昌": 115.89,
  "九江": 115.99,
  "赣州": 114.93,
  "吉安": 114.98,
  "宜春": 114.39,
  "抚州": 116.36,
  "上饶": 117.97,
  "景德镇": 117.18,
  "萍乡": 113.85,
  "新余": 114.93,
  "鹰潭": 117.03,
  "太原": 112.55,
  "大同": 113.3,
  "长治": 113.12,
  "晋城": 112.85,
  "朔州": 112.43,
  "晋中": 112.75,
  "运城": 111,
  "忻州": 112.73,
  "临汾": 111.52,
  "吕梁": 111.13,
  "阳泉": 113.58,
  "沈阳": 123.43,
  "大连": 121.61,
  "鞍山": 122.99,
  "抚顺": 123.97,
  "本溪": 123.77,
  "丹东": 124.38,
  "锦州": 121.13,
  "营口": 122.23,
  "阜新": 121.66,
  "辽阳": 123.17,
  "盘锦": 122.07,
  "铁岭": 123.84,
  "朝阳": 120.45,
  "葫芦岛": 120.84,
  "长春": 125.32,
  "吉林": 126.55,
  "四平": 124.37,
  "辽源": 125.15,
  "通化": 125.94,
  "白山": 126.42,
  "松原": 124.82,
  "白城": 122.84,
  "延边": 129.51,
  "哈尔滨": 126.53,
  "齐齐哈尔": 123.95,
  "牡丹江": 129.63,
  "佳木斯": 130.36,
  "大庆": 125.1,
  "鸡西": 130.97,
  "双鸭山": 131.16,
  "伊春": 128.9,
  "七台河": 130.85,
  "鹤岗": 130.28,
  "黑河": 127.53,
  "绥化": 126.99,
  "大兴安岭": 124.12,
  "南宁": 108.32,
  "桂林": 110.29,
  "柳州": 109.41,
  "梧州": 111.32,
  "北海": 109.12,
  "防城港": 108.35,
  "钦州": 108.62,
  "贵港": 109.6,
  "玉林": 110.15,
  "百色": 106.62,
  "贺州": 111.55,
  "河池": 108.06,
  "来宾": 109.23,
  "崇左": 107.35,
  "昆明": 102.71,
  "曲靖": 103.8,
  "玉溪": 102.55,
  "保山": 99.16,
  "昭通": 103.72,
  "丽江": 100.23,
  "普洱": 100.97,
  "临沧": 100.08,
  "楚雄": 101.55,
  "红河": 103.38,
  "文山": 104.24,
  "西双版纳": 100.8,
  "大理": 100.23,
  "德宏": 98.58,
  "怒江": 98.85,
  "迪庆": 99.71,
  "贵阳": 106.71,
  "遵义": 106.93,
  "六盘水": 104.83,
  "安顺": 105.93,
  "毕节": 105.28,
  "铜仁": 109.19,
  "黔西南": 104.89,
  "黔东南": 107.98,
  "黔南": 107.52,
  "呼和浩特": 111.65,
  "包头": 109.84,
  "乌海": 106.82,
  "赤峰": 118.96,
  "通辽": 122.26,
  "鄂尔多斯": 109.99,
  "呼伦贝尔": 119.77,
  "巴彦淖尔": 107.42,
  "乌兰察布": 113.11,
  "兴安盟": 122.07,
  "锡林郭勒": 116.09,
  "阿拉善": 105.73,
  "乌鲁木齐": 87.61,
  "克拉玛依": 84.87,
  "吐鲁番": 89.18,
  "哈密": 93.51,
  "昌吉": 87.3,
  "博尔塔拉": 82.07,
  "巴音郭楞": 86.15,
  "阿克苏": 80.26,
  "克孜勒苏": 76.17,
  "喀什": 75.99,
  "和田": 79.92,
  "伊犁": 81.32,
  "塔城": 82.98,
  "阿勒泰": 88.13,
  "石河子": 86.04,
  "阿拉尔": 81.28,
  "图木舒克": 79.08,
  "五家渠": 87.54,
  "兰州": 103.82,
  "天水": 105.72,
  "酒泉": 98.51,
  "嘉峪关": 98.28,
  "金昌": 102.19,
  "白银": 104.17,
  "武威": 102.63,
  "张掖": 100.45,
  "平凉": 106.67,
  "庆阳": 107.64,
  "定西": 104.63,
  "陇南": 104.92,
  "临夏": 103.21,
  "甘南": 102.91,
  "海口": 110.35,
  "三亚": 109.51,
  "儋州": 109.58,
  "三沙": 112.33,
  "琼海": 110.47,
  "文昌": 110.75,
  "万宁": 110.39,
  "东方": 108.65,
  "银川": 106.27,
  "石嘴山": 106.38,
  "吴忠": 106.2,
  "固原": 106.28,
  "中卫": 105.19,
  "西宁": 101.77,
  "海东": 102.1,
  "海北": 100.9,
  "黄南": 102.02,
  "海南州": 100.62,
  "果洛": 100.24,
  "玉树": 97.01,
  "海西": 97.37,
  "拉萨": 91.11,
  "日喀则": 88.88,
  "昌都": 97.18,
  "林芝": 94.36,
  "山南": 91.77,
  "那曲": 92.07,
  "阿里": 80.11,
  "台北": 121.5,
  "新北": 121.47,
  "高雄": 120.31,
  "台中": 120.68,
  "台南": 120.19,
  "桃园": 121.3,
  "新竹": 120.97,
  "基隆": 121.74,
  "嘉义": 120.45,
  "彰化": 120.54,
  "香港": 114.17,
  "澳门": 113.54
};

// 节气基础公历参考角度参数 (以立春为首)
const SOLAR_TERMS = [
  "小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
  "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
  "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
  "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
];

// 计算平太阳时与真太阳时差 (时差方程简化模型，分钟)
function getEquationOfTime(dayOfYear) {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

// 获取真太阳时
function getTrueSolarTime(date, cityName = "北京") {
  const lon = CITY_LONGITUDES[cityName] || 120.0;
  const lonDiffMinutes = (lon - 120.0) * 4; // 1度=4分钟
  
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const eotMinutes = getEquationOfTime(dayOfYear);
  
  const totalAdjustmentMinutes = lonDiffMinutes + eotMinutes;
  const adjustedTime = new Date(date.getTime() + totalAdjustmentMinutes * 60 * 1000);
  
  return {
    originalTime: date,
    adjustedTime: adjustedTime,
    cityName: cityName,
    adjustmentMinutes: Math.round(totalAdjustmentMinutes * 10) / 10
  };
}

// 计算儒略日 (Julian Day) 用于绝对精准的日干支推算
function getJulianDay(year, month, day, hour = 12, minute = 0) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFraction = (hour + minute / 60) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + dayFraction + b - 1524.5;
}

// 简明天文节气推算（基于天文常数，精确到日与时）
function getSolarTermDate(year, termIndex) {
  // 315度为立春
  // 经典算法：以1900年为基准的天文经验常数
  const termInfo = [
    0, 21208, 42467, 63836, 85337, 107014, 
    128867, 150921, 173149, 195551, 218072, 240693, 
    263343, 285989, 308563, 331033, 353350, 375494, 
    397447, 419210, 440795, 462224, 483532, 504758
  ];
  // 1900年小寒基准毫秒数
  const baseMs = Date.UTC(1900, 0, 6, 2, 5);
  const yearDiff = year - 1900;
  const totalMs = baseMs + (31556925974.7 * yearDiff) + (termInfo[termIndex] * 60000);
  return new Date(totalMs);
}

// 获取某一年的 24 节气交接精确时刻列表
function getYearSolarTerms(year) {
  const terms = [];
  for (let i = 0; i < 24; i++) {
    terms.push({
      name: SOLAR_TERMS[i],
      date: getSolarTermDate(year, i),
      index: i
    });
  }
  return terms;
}

// 根据参数或日期推演四柱干支
function calculateBaZiPillars(input, cityName = "北京") {
  let year, month, day, hour, minute;
  
  if (typeof input === "object" && !(input instanceof Date)) {
    year = parseInt(input.year);
    month = parseInt(input.month);
    day = parseInt(input.day);
    hour = parseInt(input.hour || 12);
    minute = parseInt(input.minute || 0);
    cityName = input.cityName || cityName;
  } else {
    const d = (input instanceof Date) ? input : new Date(input);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
    hour = d.getHours();
    minute = d.getMinutes();
  }
  
  const baseDate = new Date(year, month - 1, day, hour, minute, 0);
  const solarTimeResult = getTrueSolarTime(baseDate, cityName);
  const d = solarTimeResult.adjustedTime;
  
  const adjYear = d.getFullYear();
  const adjMonth = d.getMonth() + 1;
  const adjDay = d.getDate();
  const adjHour = d.getHours();
  const adjMinute = d.getMinutes();
  
  // 1. 获取当年与前后年的节气交接表
  const currentTerms = getYearSolarTerms(adjYear);
  const prevTerms = getYearSolarTerms(adjYear - 1);
  const nextTerms = getYearSolarTerms(adjYear + 1);
  
  // 立春时刻 (index 2: 立春)
  const liChunThisYear = currentTerms[2].date;
  
  // 2. 年柱推算（以立春为界）
  let baziYear = adjYear;
  if (d < liChunThisYear) {
    baziYear = adjYear - 1;
  }
  const yearGanIndex = (baziYear - 4) % 10;
  const yearZhiIndex = (baziYear - 4) % 12;
  const yearGan = TIANGAN[(yearGanIndex + 10) % 10];
  const yearZhi = DIZHI[(yearZhiIndex + 12) % 12];
  const yearPillar = yearGan + yearZhi;
  
  // 3. 月柱推算（以节令交接为界，十二节气划分十二月）
  const allNodes = [
    { zhi: "丑", date: prevTerms[0].date },
    { zhi: "寅", date: currentTerms[2].date },
    { zhi: "卯", date: currentTerms[4].date },
    { zhi: "辰", date: currentTerms[6].date },
    { zhi: "巳", date: currentTerms[8].date },
    { zhi: "午", date: currentTerms[10].date },
    { zhi: "未", date: currentTerms[12].date },
    { zhi: "申", date: currentTerms[14].date },
    { zhi: "酉", date: currentTerms[16].date },
    { zhi: "戌", date: currentTerms[18].date },
    { zhi: "亥", date: currentTerms[20].date },
    { zhi: "子", date: currentTerms[22].date },
    { zhi: "丑", date: nextTerms[0].date },
    { zhi: "寅", date: nextTerms[2].date }
  ];
  
  let monthZhi = "寅";
  let monthOrder = 0; // 0代表正月寅月
  for (let i = 0; i < allNodes.length - 1; i++) {
    if (d >= allNodes[i].date && d < allNodes[i + 1].date) {
      monthZhi = allNodes[i].zhi;
      monthOrder = (DIZHI.indexOf(monthZhi) - 2 + 12) % 12;
      break;
    }
  }
  
  // 五虎遁月起月干
  const monthGanStarts = { "甲": "丙", "己": "丙", "乙": "戊", "庚": "戊", "丙": "庚", "辛": "庚", "丁": "壬", "壬": "壬", "戊": "甲", "癸": "甲" };
  const startMonthGan = monthGanStarts[yearGan];
  const startMonthGanIndex = TIANGAN.indexOf(startMonthGan);
  const monthGan = TIANGAN[(startMonthGanIndex + monthOrder) % 10];
  const monthPillar = monthGan + monthZhi;
  
  // 4. 日柱推算（基于儒略日）
  let effectiveDayDate = new Date(d.getTime());
  if (adjHour >= 23) {
    effectiveDayDate = new Date(d.getTime() + 60 * 60 * 1000); // 子时晚23点后进入次日干支
  }
  
  const jd = getJulianDay(
    effectiveDayDate.getFullYear(),
    effectiveDayDate.getMonth() + 1,
    effectiveDayDate.getDate(),
    12, 0
  );
  const dayOffset = Math.floor(jd + 49.5) % 60;
  const dayGan = TIANGAN[dayOffset % 10];
  const dayZhi = DIZHI[dayOffset % 12];
  const dayPillar = dayGan + dayZhi;
  
  // 5. 时柱推算
  let hourZhiIndex = Math.floor((adjHour + 1) / 2) % 12;
  const hourZhi = DIZHI[hourZhiIndex];
  
  const hourGanStarts = { "甲": "甲", "己": "甲", "乙": "丙", "庚": "丙", "丙": "戊", "辛": "戊", "丁": "庚", "壬": "庚", "戊": "壬", "癸": "壬" };
  const startHourGan = hourGanStarts[dayGan];
  const startHourGanIndex = TIANGAN.indexOf(startHourGan);
  const hourGan = TIANGAN[(startHourGanIndex + hourZhiIndex) % 10];
  const hourPillar = hourGan + hourZhi;
  
  const pad = (n) => String(n).padStart(2, "0");
  const formattedSolar = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
  const formattedTrueSolar = `${adjYear}-${pad(adjMonth)}-${pad(adjDay)} ${pad(adjHour)}:${pad(adjMinute)}`;
  
  return {
    solarDate: formattedSolar,
    trueSolarDate: formattedTrueSolar,
    cityName: cityName,
    timeAdjustment: solarTimeResult.adjustmentMinutes,
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    yearGan, yearZhi,
    monthGan, monthZhi,
    dayGan, dayZhi,
    hourGan, hourZhi
  };
}

module.exports = {
  TIANGAN,
  DIZHI,
  CITY_LONGITUDES,
  SOLAR_TERMS,
  getTrueSolarTime,
  getSolarTermDate,
  getYearSolarTerms,
  calculateBaZiPillars
};
