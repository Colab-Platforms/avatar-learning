// ─────────────────────────────────────────────────────────────
//  Ava Chatbot — app.js  |  Avatar AI Ecosystem
//  Talks to Python FastAPI backend at localhost:8000
// ─────────────────────────────────────────────────────────────

const API_URL = "http://127.0.0.1:8000/chat";

let history = [];
let busy    = false;

// ── Auto-grow textarea ────────────────────────────────────────
function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 100) + "px";
}

// ── Send on Enter (Shift+Enter = new line) ────────────────────
function onKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

// ── Quick-reply chip clicked ──────────────────────────────────
function onChip(el) {
  document.getElementById("chatInput").value = el.textContent.trim();
  send();
}

// ── Scroll to bottom ──────────────────────────────────────────
function scrollBottom() {
  const m = document.getElementById("messages");
  m.scrollTop = m.scrollHeight;
}

// ── Show / hide typing indicator ──────────────────────────────
function showTyping(on) {
  document.getElementById("typingRow").classList.toggle("show", on);
  document.getElementById("sendBtn").disabled = on;
  scrollBottom();
}

// ── Add a bubble to the chat ──────────────────────────────────
function addBubble(role, text) {
  const messages = document.getElementById("messages");
  const typing   = document.getElementById("typingRow");

  const row = document.createElement("div");
  row.className = "msg-row " + role;

  // Light markdown: **bold**, newline bullets
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,     "<em>$1</em>")
    .replace(/\n- /g,          "<br>• ")
    .replace(/\n/g,            "<br>");

  if (role === "bot") {
    row.innerHTML = `
      <div class="msg-bot-avatar">🤖</div>
      <div class="bubble bot">${html}</div>`;
  } else {
    row.innerHTML = `<div class="bubble user">${html}</div>`;
    // Hide chips once user starts typing
    document.getElementById("chipsArea").style.display = "none";
  }

  messages.insertBefore(row, typing);
  scrollBottom();
}

// ── Main send function ────────────────────────────────────────
async function send() {

  const input = document.getElementById("chatInput");
  const userMessage = input.value.trim();

  if (!userMessage || busy) return;

  addBubble("user", userMessage);

  history.push({
    role: "user",
    content: userMessage
  });

  input.value = "";

  showTyping(true);
  busy = true;

  try {

    console.log("API:", API_URL);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage,
        history: history
      })
    });

      if (!response.ok) {
       throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

       console.log(data);

       addBubble("bot", data.reply);

    history.push({
      role: "assistant",
      content: data.reply
    });

  } catch (err) {

    console.error("Ava error:", err);

    addBubble(
      "bot",
      "Couldn't reach the server."
    );

  } finally {
    busy = false;
    showTyping(false);
  }
}

// ── Smooth Left ↔ Right Auto Slide ─────────────────────

const chipsArea = document.getElementById("chipsArea");

let autoScroll;

// direction:
// 1 = right
// -1 = left
let direction = 1;

function startAutoSlide() {

  autoScroll = setInterval(() => {

    chipsArea.scrollLeft += direction;

    // reached RIGHT end
    if (
      chipsArea.scrollLeft >=
      chipsArea.scrollWidth - chipsArea.clientWidth
    ) {
      direction = -1;
    }

    // reached LEFT start
    if (chipsArea.scrollLeft <= 0) {
      direction = 1;
    }

  }, 20);

}

function stopAutoSlide() {
  clearInterval(autoScroll);
}

// start initially
startAutoSlide();

// pause on hover
chipsArea.addEventListener("mouseenter", stopAutoSlide);

chipsArea.addEventListener("mouseleave", startAutoSlide);

// mobile touch pause
chipsArea.addEventListener("touchstart", stopAutoSlide);

chipsArea.addEventListener("touchend", startAutoSlide);