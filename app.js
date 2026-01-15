async function getTaijiPrescription() {
  const userInput = document.getElementById('userInput').value;
  const resultDiv = document.getElementById('result');
  const loading = document.getElementById('loading');

  if (!userInput) {
    alert("请先描述您的情况");
    return;
  }

  loading.style.display = 'block';
  resultDiv.style.display = 'none';

  // --- DeepSeek API 配置 ---
  const API_KEY = 'sk-bc679b8e6e004df0bb1ad9d02bf0006f'; // 填入你的 DeepSeek Key
  const API_URL = 'https://api.deepseek.com/chat/completions'; // DeepSeek 官方接口地址

  // 如果你想用推理模型，填 'deepseek-reasoner' (R1)
  // 如果你想用普通对话模型，填 'deepseek-chat' (V3)
  const MODEL_NAME = 'deepseek-chat';

  const prompt = `你是一位精通太极拳与中医养生的专家。
    用户描述：${userInput}
    请根据描述，推荐一个具体的太极拳招式（如：起势、云手、野马分鬃、金鸡独立等），
    说明理由（中医原理）以及动作要领。
    要求：语气温和、专业。输出格式请包含以下部分：
    【推荐招式】：
    【调理原理】：
    【动作要点】：`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "你是一个专业的太极养生顾问。" },
          { role: "user", content: prompt }
        ],
        stream: false // 设置为 false 方便初学者处理数据
      })
    });

    const data = await response.json();

    // DeepSeek 的返回结构与 OpenAI 一致
    const advice = data.choices[0].message.content;

    loading.style.display = 'none';
    resultDiv.style.display = 'block';

    // 使用 innerHTML 处理换行，让输出更整洁
    resultDiv.innerHTML = advice.replace(/\n/g, '<br>');

  } catch (error) {
    console.error('Error:', error);
    loading.innerText = "气路受阻（网络或API错误），请稍后再试。";
  }
}