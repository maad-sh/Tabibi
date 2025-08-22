const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// توليد مفتاح الجلسة حسب تاريخ اليوم
function getSessionKey() {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  return `chatSession_${dateKey}`;
}

let sessionKey = getSessionKey();
let conversation = JSON.parse(localStorage.getItem(sessionKey)) || [];

// عند تحميل الصفحة
window.onload = () => {
  renderMessages();
  renderChatList();
};

// إرسال الرسالة
function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";
  sendBtn.style.display = "none";
  saveToStorage("user", text);

  showTyping();

  fetchAIResponse(text).then((reply) => {
    removeTyping();
    appendMessage("bot", reply);
    saveToStorage("bot", reply);
    renderChatList();
  });
}

// تنسيق رد الذكاء الاصطناعي
function formatBotReply(text) {
  let html = text.replace(/\n/g, "<br>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  return html;
}

// عرض الرسائل
function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender === "user" ? "user-message" : "bot-message");
  div.innerHTML = sender === "bot" ? formatBotReply(text) : text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// نقاط الكتابة
function showTyping() {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot-message");
  typing.id = "typing";
  typing.innerHTML = "يكتب";
  let dots = 0;
  typing.interval = setInterval(() => {
    dots = (dots + 1) % 4;
    typing.innerHTML = "يكتب" + ".".repeat(dots);
  }, 400);
  chatArea.appendChild(typing);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing");
  if (typing) {
    clearInterval(typing.interval);
    typing.remove();
  }
}

// محاكاة رد الذكاء الاصطناعي
async function fetchAIResponse(userText) {
  const API_KEY = "AIzaSyCe0WUHUHivGoJNrsjimihDrNEuZTYcfGQ"; 
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "أنت طبيب افتراضي مساعد محترف..." },
              { text: userText }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "حدث خطأ أثناء محاولة التواصل مع الذكاء الاصطناعي.";
  }
}

// حفظ الرسائل في جلسة واحدة
function saveToStorage(sender, text) {
  conversation.push({ sender, text });
  localStorage.setItem(sessionKey, JSON.stringify(conversation));
}

// إعادة عرض الرسائل
function renderMessages() {
  conversation.forEach((msg) => {
    appendMessage(msg.sender, msg.text);
  });
}

// إظهار زر الإرسال فقط عند الكتابة
function toggleSendIcon(textarea) {
  sendBtn.style.display = textarea.value.trim() ? "inline-flex" : "none";
}

// القائمة الجانبية
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// عرض جلسة واحدة فقط في القائمة مع عنوان وتاريخ
function renderChatList() {
  const list = document.getElementById("chatList");
  if (!list) return;
  list.innerHTML = "";

  const firstUserMessage = conversation.find(msg => msg.sender === "user");
  const firstBotMessage = conversation.find(msg => msg.sender === "bot");

  if (firstUserMessage && firstBotMessage) {
    let title = firstBotMessage.text.split("\n")[0];
    title = title.replace("التشخيص المبدئي:", "").trim();
    if (title.length > 30) title = title.slice(0, 30) + "...";

    const rawDate = sessionKey.replace("chatSession_", "");
    const formattedDate = formatArabicDate(rawDate);

    const item = document.createElement("div");
    item.className = "chat-item";
    item.innerHTML = `
      <div style="flex-grow:1">
        <strong>${title || "محادثة طبية"}</strong><br>
        <small>${formattedDate}</small>
      </div>
      <span class="chat-options" onclick="deleteSession()">⋮</span>
    `;
    list.appendChild(item);
  }
}

// تحويل التاريخ إلى صيغة عربية
function formatArabicDate(dateString) {
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;

  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  return `${day} ${months[month]} ${year}`;
}

// حذف الجلسة بالكامل
function deleteSession() {
  if (confirm("هل تريد حذف هذه المحادثة؟")) {
    localStorage.removeItem(sessionKey);
    location.reload();
  }
}
