// --- 配置区 ---
const API_KEY = 'sk-bc679b8e6e004df0bb1ad9d02bf0006f'; // 替换为你的 DeepSeek API Key
const API_URL = 'https://api.deepseek.com/chat/completions';
const HISTORY_KEY = "taiji_pro_history";

let quizData = [];
let userAnswers = {};
let currentAdvice = "";

window.onload = displayHistory;

// 1. 生成问卷逻辑
async function generateQuiz() {
  const text = document.getElementById('userInput').value.trim();
  if (!text) return alert("请先填写症状描述");

  showLoading(true);

  const prompt = `你是一位太极养生专家。基于用户描述：“${text}”，请生成5道单选题。
    要求：每题4个选项，直接输出JSON数组，出题内容为辅助用户更好地描述自己身体的不适，格式如下：
    [{"q":"问题内容","options":{"A":"选项1","B":"选项2","C":"选项3","D":"选项4"}}]
    不要输出任何Markdown标记或多余文字。`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    quizData = JSON.parse(rawContent.substring(rawContent.indexOf('['), rawContent.lastIndexOf(']') + 1));

    renderQuiz();
  } catch (e) {
    alert("问卷生成失败，请确认API Key是否正确");
  } finally {
    showLoading(false);
  }
}

function renderQuiz() {
  document.getElementById('step1').style.display = 'none';
  const section = document.getElementById('quizSection');
  const container = document.getElementById('quizContainer');
  section.style.display = 'block';

  container.innerHTML = quizData.map((item, idx) => `
        <div class="question">
            <p><strong>${idx + 1}. ${item.q}</strong></p >
            <div class="options-grid">
                ${Object.entries(item.options).map(([k, v]) => `
                    <div class="option-btn" onclick="selectOption(${idx}, '${k}', this)">${k}. ${v}</div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectOption(qIdx, key, btn) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  userAnswers[qIdx] = `问题:${quizData[qIdx].q}, 回答:${quizData[qIdx].options[key]}`;
}

// 2. 生成最终处方逻辑
async function getFinalPrescription() {
  if (Object.keys(userAnswers).length < 5) return alert("请回答所有问题");

  document.getElementById('quizSection').style.display = 'none';
  showLoading(true);

  const quizSummary = Object.values(userAnswers).join('；');
  const finalPrompt = `你是一位精通太极拳与中医养生的专家。
    用户初诉：${document.getElementById('userInput').value}
    辩证细节：${quizSummary}
    
    请输出纯文本处方，且只推荐一个招式。严禁使用Markdown（如#或*符号）。
    格式必须严格如下：
    【推荐招式】：(仅写招式名称)
    【调理原理】：(100字以内)
    【动作要点】：(简要步骤)
    【养生建议】：(生活细节)`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: finalPrompt }]
      })
    });

    const data = await response.json();
    currentAdvice = data.choices[0].message.content;

    // 匹配视频并显示结果
    processResult(currentAdvice);
    saveHistory(document.getElementById('userInput').value, currentAdvice);

  } catch (e) {
    alert("处方生成失败");
  } finally {
    showLoading(false);
  }
}

// 3. 结果处理与视频加载
function processResult(text) {
  const resultDiv = document.getElementById('result');
  const videoContainer = document.getElementById('videoContainer');

  // 正则提取招式名称
  const match = text.match(/【推荐招式】：(.+)/);
  if (match) {
    const actionName = match[1].trim();
    // 尝试加载对应的 MP4
    videoContainer.innerHTML = `
            <video src="img/${actionName}.mp4" autoplay loop muted playsinline onerror="this.parentElement.style.display='none'">
                您的浏览器不支持视频
            </video>
        `;
    videoContainer.style.display = 'block';
  }

  resultDiv.textContent = text;
  resultDiv.style.display = 'block';
  document.getElementById('finalBtns').style.display = 'flex';
}

// 辅助功能
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function saveHistory(q, a) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.unshift({ id: Date.now(), query: q, answer: a, date: new Date().toLocaleDateString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
  displayHistory();
}

function displayHistory() {
  const list = document.getElementById('historyList');
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  list.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadHistory('${encodeURIComponent(item.answer)}')">
            [${item.date}] ${item.query}
        </div>
    `).join('');
}

function loadHistory(encodedAnswer) {
  document.getElementById('step1').style.display = 'none';
  processResult(decodeURIComponent(encodedAnswer));
}

function exportToLocal() {
  const blob = new Blob([currentAdvice], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `太极处方_${Date.now()}.txt`;
  a.click();
}
