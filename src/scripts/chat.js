const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const apiKeyButton = document.getElementById("api-key-button");
const apiKeyInputContainer = document.getElementById("api-key-input-container");
const apiKeyInput = document.getElementById("api-key-input");
const saveApiKeyButton = document.getElementById("save-api-key");
let isBotTyping = false;
let typingDiv = null;
let apiKey = localStorage.getItem("geminiApiKey") || null;

if (
  !sendButton ||
  !userInput ||
  !chatContainer ||
  !apiKeyButton ||
  !apiKeyInputContainer ||
  !apiKeyInput ||
  !saveApiKeyButton
) {
  console.error("Error: Uno o más elementos del DOM no se encontraron.");
} else {
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("focus", resetBackground);
  userInput.addEventListener("input", resetBackground);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      console.log("Enter presionado");
      sendMessage();
    }
  });

  apiKeyButton.addEventListener("click", () => {
    console.log("Clic en api-key-button");
    apiKeyInputContainer.classList.toggle("hidden");
  });

  saveApiKeyButton.addEventListener("click", () => {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
      apiKey = newApiKey;
      localStorage.setItem("geminiApiKey", apiKey);
      apiKeyInputContainer.classList.add("hidden");
      apiKeyInput.value = "";
      console.log("API Key guardada:", apiKey);
    }
  });
}

function resetBackground() {
  if (!isBotTyping) {
    document.body.classList.remove("bg-gradient-to-r", "from-purple-900", "to-violet-900");
    document.body.classList.add("bg-gradient-to-r", "from-slate-500", "to-slate-800");
  }
}

async function sendMessage() {
  const message = userInput?.value.trim() ?? "";
  if (!message) {
    return;
  }

  addMessage("user", message);
  userInput.value = "";
  userInput.disabled = true;

  isBotTyping = true;

  document.body.classList.remove("bg-gradient-to-r", "from-slate-500", "to-slate-800");
  document.body.classList.add("bg-gradient-to-r", "from-slate-500", "to-slate-800");

  typingDiv = addTypingAnimation();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey || "",
      },
      body: JSON.stringify({ message }),
    });

    if (typingDiv) {
      typingDiv.remove();
      typingDiv = null;
    }

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    let data;
    try {
      const text = await response.text();
      console.log("Respuesta del servidor:", text);
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      isBotTyping = false;
      userInput.disabled = false;
      addMessage("bot", "Error: Respuesta del servidor no válida");
      return;
    }

    document.body.classList.remove("bg-gradient-to-r", "from-slate-500", "to-slate-800");
    document.body.classList.add("bg-gradient-to-r", "from-purple-900", "to-violet-900");

    if (data.reply) {
      await typeMessage("bot", data.reply);
    } else if (data.error) {
      await typeMessage("bot", `Error: ${data.error}`);
    } else {
      await typeMessage("bot", "Error: Respuesta inesperada del servidor");
    }
  } catch (error) {
    console.error("Error completo:", error);

    if (typingDiv) {
      typingDiv.remove();
      typingDiv = null;
    }
    await typeMessage(
      "bot",
      `Error al conectar con el servidor: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }

  isBotTyping = false;
  userInput.disabled = false;
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function addMessage(role, text) {
  if (!chatContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `my-2 p-3 rounded-lg max-w-xs break-words ${
    role === "user" ? "bg-purple-500 text-white self-end ml-auto" : "bg-white/50 text-gray-800 self-start mr-auto"
  }`;

  messageDiv.style.alignSelf = role === "user" ? "flex-end" : "flex-start";

  const messageWrapper = document.createElement("div");
  messageWrapper.className = "flex";
  if (role === "user") {
    messageWrapper.classList.add("justify-end");
  }

  const content = document.createElement("span");
  content.textContent = text;

  messageDiv.appendChild(content);
  chatContainer.appendChild(messageDiv);
}

async function typeMessage(role, text) {
  if (!chatContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `my-2 p-3 rounded-lg max-w-xs break-words ${
    role === "user" ? "bg-purple-500 text-white self-end ml-auto" : "bg-white/50 text-gray-800 self-start mr-auto"
  }`;

  messageDiv.style.alignSelf = role === "user" ? "flex-end" : "flex-start";

  const messageWrapper = document.createElement("div");
  messageWrapper.className = "flex";
  if (role === "user") {
    messageWrapper.classList.add("justify-end");
  }

  const content = document.createElement("div"); 
  messageDiv.appendChild(content);
  chatContainer.appendChild(messageDiv);

  let currentLine = document.createElement("span");
  content.appendChild(currentLine);


  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\n" && currentLine.textContent.trim() !== "") {
      currentLine = document.createElement("span");
      const br = document.createElement("br");
      content.appendChild(br);
      content.appendChild(currentLine);
    } else if (char !== "\n") {
      currentLine.textContent += char;
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
    await new Promise((resolve) => setTimeout(resolve, 10)); 
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addTypingAnimation() {
  if (!chatContainer) return null;

  const typingDiv = document.createElement("div");
  typingDiv.className = "my-2 p-3 rounded-lg max-w-xs bg-white/50 text-gray-800 self-start mr-auto";
  typingDiv.style.alignSelf = "flex-start";

  const dots = document.createElement("span");
  dots.className = "typing-dots";
  dots.textContent = "...";

  const style = document.createElement("style");
  style.textContent = `
    .typing-dots::after {
      content: '...';
      display: inline-block;
      width: 1em;
      text-align: left;
      animation: dots 1.5s infinite;
    }
    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60% { content: '...'; }
    }
  `;
  document.head.appendChild(style);

  typingDiv.appendChild(dots);
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return typingDiv;
}