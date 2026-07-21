window.PD = window.PD || {};
window.PD.Components = window.PD.Components || {};

window.PD.Components.AIChatSidebar = (function () {
  var STORAGE_KEY_MESSAGES = "projectDecember.aiChat.messages.v1";
  var STORAGE_KEY_SUBJECT = "projectDecember.aiChat.subject.v1";
  var STORAGE_KEY_CHAPTER = "projectDecember.aiChat.chapter.v1";

  var drawerEl = null;
  var triggerBtn = null;
  var messagesContainer = null;
  var inputEl = null;
  var sendBtn = null;
  var subjectSelect = null;
  var chapterSelect = null;

  var currentSubject = "All";
  var currentChapter = "General Study";
  var messages = [];
  var isGenerating = false;

  function init() {
    loadSavedState();
    renderDrawer();
    renderFloatingTrigger();
    attachGlobalListeners();
  }

  function loadSavedState() {
    try {
      var savedSub = localStorage.getItem(STORAGE_KEY_SUBJECT);
      if (savedSub) currentSubject = savedSub;

      var savedChap = localStorage.getItem(STORAGE_KEY_CHAPTER);
      if (savedChap) currentChapter = savedChap;

      var savedMsgs = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMsgs) {
        messages = JSON.parse(savedMsgs);
      }
    } catch (e) {
      console.warn("Could not load AI chat state from localStorage", e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECT, currentSubject);
      localStorage.setItem(STORAGE_KEY_CHAPTER, currentChapter);
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save AI chat state to localStorage", e);
    }
  }

  function renderFloatingTrigger() {
    if (document.querySelector(".ai-chat-floating-trigger")) return;

    triggerBtn = document.createElement("button");
    triggerBtn.className = "ai-chat-floating-trigger";
    triggerBtn.type = "button";
    triggerBtn.innerHTML = `<span>🤖</span> <span>Ask JEE AI</span>`;
    triggerBtn.title = "Ask JEE AI Tutor questions about your study topics";

    triggerBtn.addEventListener("click", function () {
      toggle();
    });

    document.body.appendChild(triggerBtn);
  }

  function renderDrawer() {
    if (document.querySelector(".ai-chat-drawer")) return;

    drawerEl = document.createElement("div");
    drawerEl.className = "ai-chat-drawer";

    // Header
    var header = document.createElement("div");
    header.className = "ai-chat-header";
    header.innerHTML = `
      <div class="ai-chat-title-group">
        <div class="ai-chat-avatar">⚛</div>
        <div>
          <h3 class="ai-chat-title">JEE AI Study Tutor</h3>
          <p class="ai-chat-sub">Powered by Gemini AI • Main & Advanced</p>
        </div>
      </div>
      <div class="ai-chat-header-actions">
        <button class="ai-chat-icon-btn ai-chat-clear-btn" type="button" title="Clear Chat History">🗑</button>
        <button class="ai-chat-icon-btn ai-chat-close-btn" type="button" title="Close AI Assistant">✕</button>
      </div>
    `;

    // Context Bar
    var contextBar = document.createElement("div");
    contextBar.className = "ai-chat-context-bar";

    var contextLabel = document.createElement("div");
    contextLabel.className = "ai-chat-context-label";
    contextLabel.innerHTML = `<span>Target Study Topic</span> <span class="ai-chat-sync-badge" style="font-size:10px; color:var(--accent-primary); cursor:pointer;" title="Sync with active Tracker filter">🔄 Auto-Sync</span>`;

    var selectors = document.createElement("div");
    selectors.className = "ai-chat-context-selectors";

    subjectSelect = document.createElement("select");
    subjectSelect.className = "ai-chat-select";
    subjectSelect.innerHTML = `
      <option value="All">All Subjects</option>
      <option value="Physics">Physics ⚛️</option>
      <option value="Chemistry">Chemistry 🧪</option>
      <option value="Mathematics">Mathematics 📐</option>
    `;
    subjectSelect.value = currentSubject;

    chapterSelect = document.createElement("select");
    chapterSelect.className = "ai-chat-select";

    selectors.appendChild(subjectSelect);
    selectors.appendChild(chapterSelect);

    contextBar.appendChild(contextLabel);
    contextBar.appendChild(selectors);

    // Messages container
    messagesContainer = document.createElement("div");
    messagesContainer.className = "ai-chat-messages";

    // Footer / Input Area
    var footer = document.createElement("div");
    footer.className = "ai-chat-footer";

    var inputWrapper = document.createElement("div");
    inputWrapper.className = "ai-chat-input-wrapper";

    inputEl = document.createElement("textarea");
    inputEl.className = "ai-chat-input";
    inputEl.placeholder = "Ask a question, formula, or concept...";
    inputEl.rows = 1;

    sendBtn = document.createElement("button");
    sendBtn.className = "ai-chat-send-btn";
    sendBtn.type = "button";
    sendBtn.innerHTML = "➔";
    sendBtn.title = "Send question";

    inputWrapper.appendChild(inputEl);
    inputWrapper.appendChild(sendBtn);
    footer.appendChild(inputWrapper);

    drawerEl.appendChild(header);
    drawerEl.appendChild(contextBar);
    drawerEl.appendChild(messagesContainer);
    drawerEl.appendChild(footer);

    document.body.appendChild(drawerEl);

    // Event handlers
    header.querySelector(".ai-chat-close-btn").addEventListener("click", close);
    header.querySelector(".ai-chat-clear-btn").addEventListener("click", clearHistory);
    contextLabel.querySelector(".ai-chat-sync-badge").addEventListener("click", syncWithTrackerContext);

    subjectSelect.addEventListener("change", function () {
      currentSubject = subjectSelect.value;
      populateChapters();
      saveState();
    });

    chapterSelect.addEventListener("change", function () {
      currentChapter = chapterSelect.value;
      saveState();
    });

    sendBtn.addEventListener("click", handleSubmit);

    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    });

    inputEl.addEventListener("input", function () {
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
    });

    populateChapters();
    renderMessages();
  }

  function populateChapters() {
    if (!chapterSelect) return;
    chapterSelect.innerHTML = "";

    var optGeneral = document.createElement("option");
    optGeneral.value = "General Study";
    optGeneral.textContent = "General " + (currentSubject === "All" ? "JEE" : currentSubject) + " Topic";
    chapterSelect.appendChild(optGeneral);

    if (window.PD && window.PD.Store && typeof window.PD.Store.getChapters === "function") {
      var allChapters = window.PD.Store.getChapters() || [];
      var filtered = allChapters.filter(function (c) {
        return currentSubject === "All" || c.subject === currentSubject;
      });

      filtered.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c.chapter;
        opt.textContent = c.chapter;
        chapterSelect.appendChild(opt);
      });
    }

    if (currentChapter && Array.from(chapterSelect.options).some(function (o) { return o.value === currentChapter; })) {
      chapterSelect.value = currentChapter;
    } else {
      chapterSelect.value = "General Study";
      currentChapter = "General Study";
    }
  }

  function syncWithTrackerContext() {
    if (window.PD && window.PD.Store && typeof window.PD.Store.getTrackerFilters === "function") {
      var filters = window.PD.Store.getTrackerFilters();
      if (filters && filters.subject) {
        currentSubject = filters.subject;
        subjectSelect.value = currentSubject;
        populateChapters();
        saveState();

        if (window.PD.Services && window.PD.Services.Shortcuts) {
          // Toast user
        }
      }
    }
  }

  function open(options) {
    if (!drawerEl) init();

    if (options) {
      if (options.subject) {
        currentSubject = options.subject;
        if (subjectSelect) subjectSelect.value = currentSubject;
        populateChapters();
      }
      if (options.chapter) {
        currentChapter = options.chapter;
        if (chapterSelect) chapterSelect.value = currentChapter;
      }
    }

    drawerEl.classList.add("is-open");
    if (triggerBtn) triggerBtn.classList.add("is-hidden");

    setTimeout(function () {
      if (inputEl) inputEl.focus();
    }, 100);
  }

  function close() {
    if (drawerEl) drawerEl.classList.remove("is-open");
    if (triggerBtn) triggerBtn.classList.remove("is-hidden");
  }

  function toggle() {
    if (drawerEl && drawerEl.classList.contains("is-open")) {
      close();
    } else {
      open();
    }
  }

  function clearHistory() {
    if (confirm("Clear all AI chat message history?")) {
      messages = [];
      saveState();
      renderMessages();
    }
  }

  function renderMessages() {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = "";

    if (messages.length === 0) {
      var emptyState = document.createElement("div");
      emptyState.className = "ai-chat-empty-state";
      emptyState.innerHTML = `
        <div class="ai-chat-empty-icon">⚛️</div>
        <h4 class="ai-chat-empty-title">JEE Study Companion</h4>
        <p class="ai-chat-empty-desc">Ask any concept question, formula clarification, derivation step, or JEE practice problem for <strong>${escapeHtml(currentSubject)} • ${escapeHtml(currentChapter)}</strong>.</p>
        <div class="ai-chat-quick-prompts">
          <button class="ai-quick-btn" type="button" data-prompt="Explain the key concepts and fundamental formulas for ${escapeHtml(currentChapter)}">
            <span>💡</span> <span>Explain key formulas & concepts</span>
          </button>
          <button class="ai-quick-btn" type="button" data-prompt="Give me a high-yield JEE Advanced practice problem on ${escapeHtml(currentChapter)} with step-by-step solution">
            <span>✍️</span> <span>JEE Advanced practice question</span>
          </button>
          <button class="ai-quick-btn" type="button" data-prompt="What are the common traps, mistakes, and tricks in ${escapeHtml(currentChapter)}?">
            <span>⚠️</span> <span>Common mistakes & traps</span>
          </button>
          <button class="ai-quick-btn" type="button" data-prompt="Give me a 3-minute revision quick summary for ${escapeHtml(currentChapter)}">
            <span>📝</span> <span>Quick revision summary</span>
          </button>
        </div>
      `;

      emptyState.querySelectorAll(".ai-quick-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var p = btn.getAttribute("data-prompt");
          if (p) sendMessage(p);
        });
      });

      messagesContainer.appendChild(emptyState);
      return;
    }

    messages.forEach(function (msg) {
      var msgEl = document.createElement("div");
      msgEl.className = "ai-msg ai-msg-" + (msg.role === "user" ? "user" : "assistant");

      var senderEl = document.createElement("span");
      senderEl.className = "ai-msg-sender";
      senderEl.textContent = msg.role === "user" ? "You" : "JEE AI Tutor";

      var bubbleEl = document.createElement("div");
      bubbleEl.className = "ai-msg-bubble";

      if (msg.role === "user") {
        bubbleEl.textContent = msg.text;
      } else {
        bubbleEl.innerHTML = formatMarkdown(msg.text);
      }

      msgEl.appendChild(senderEl);
      msgEl.appendChild(bubbleEl);
      messagesContainer.appendChild(msgEl);
    });

    if (isGenerating) {
      var typingEl = document.createElement("div");
      typingEl.className = "ai-msg ai-msg-assistant";
      typingEl.innerHTML = `
        <span class="ai-msg-sender">JEE AI Tutor</span>
        <div class="ai-typing-indicator">
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(typingEl);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function handleSubmit() {
    if (!inputEl) return;
    var text = inputEl.value.trim();
    if (!text || isGenerating) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    sendMessage(text);
  }

  function sendMessage(textPrompt) {
    if (!textPrompt || isGenerating) return;

    // Append user message
    messages.push({ role: "user", text: textPrompt, timestamp: Date.now() });
    isGenerating = true;
    saveState();
    renderMessages();

    // Prepare API request payload
    var historyPayload = messages.slice(0, -1).map(function (m) {
      return { role: m.role, text: m.text };
    });

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: textPrompt,
        subject: currentSubject,
        topic: currentChapter,
        history: historyPayload
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (err) {
            throw new Error(err.error || "Failed to contact AI service.");
          });
        }
        return res.json();
      })
      .then(function (data) {
        isGenerating = false;
        var reply = data.reply || "No response generated.";

        // Intercept AI action triggers
        executeAIAction(reply);

        messages.push({ role: "assistant", text: reply, timestamp: Date.now() });
        saveState();
        renderMessages();
      })
      .catch(function (err) {
        console.error("AI Chat error:", err);
        isGenerating = false;
        var errorMsg = "⚠️ " + (err.message || "Unable to reach Gemini API. Ensure server is running.");
        messages.push({ role: "assistant", text: errorMsg, timestamp: Date.now() });
        saveState();
        renderMessages();
      });
  }

  function formatMarkdown(text) {
    if (!text) return "";
    var escaped = escapeHtml(text);

    // Convert code blocks ``` code ```
    escaped = escaped.replace(/```([\s\S]*?)```/g, function (match, code) {
      return "<pre><code>" + code.trim() + "</code></pre>";
    });

    // Convert inline code `code`
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Convert LaTeX math equations $E=mc^2$ or $$...$$
    escaped = escaped.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-expr" style="margin:6px 0; font-weight:600;">$1</div>');
    escaped = escaped.replace(/\$([^\$]+)\$/g, '<span class="math-expr">$1</span>');

    // Convert **bold**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Convert *italic*
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Convert line breaks and lists
    var lines = escaped.split("\n");
    var html = "";
    var inList = false;

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (trimmed.indexOf("- ") === 0 || trimmed.indexOf("* ") === 0) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += "<li>" + trimmed.substring(2) + "</li>";
      } else {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        if (trimmed.length > 0) {
          html += "<p>" + trimmed + "</p>";
        }
      }
    });

    if (inList) html += "</ul>";

    return html;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function executeAIAction(replyText) {
    if (!replyText || typeof replyText !== "string") return;

    var actionMatch = replyText.match(/\{\s*"action"\s*:\s*"([^"]+)"(?:\s*,\s*"payload"\s*:\s*"?([^"\}]+)"?)?\s*\}/i);
    if (!actionMatch) return;

    var action = actionMatch[1];
    var payload = actionMatch[2];

    try {
      if (action === "SET_PLAN_START") {
        var date = payload || "2026-07-22";
        if (window.PD && window.PD.Store) {
          window.PD.Store.setPlanStartDate(date);
        }
      } else if (action === "PUMP_DOWN_HEALTH") {
        if (window.PD && window.PD.Store && typeof window.PD.Store.pumpDownHealth === "function") {
          window.PD.Store.pumpDownHealth();
        }
      } else if (action === "RESET_STUDY_HOURS") {
        if (window.PD && window.PD.Store) {
          window.PD.Store.resetAnalytics();
        }
      } else if (action === "TRIGGER_RESCUE_MODE") {
        if (window.PD && window.PD.Services && window.PD.Services.Focus) {
          window.PD.Services.Focus.updateFocusState({ rescueModeActive: true });
        }
      } else if (action === "SET_DAILY_TARGET") {
        var hrs = Number(payload) || 6;
        if (window.PD && window.PD.Services && window.PD.Services.Focus) {
          window.PD.Services.Focus.updateFocusState({ dailyTargetHours: hrs });
        }
      }

      // Re-render active page to reflect state update
      if (window.PD && window.PD.Router && typeof window.PD.Router.refresh === "function") {
        window.PD.Router.refresh();
      }
    } catch (err) {
      console.warn("AI Action execution failed:", err);
    }
  }

  function attachGlobalListeners() {
    document.addEventListener("keydown", function (e) {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        toggle();
      }
    });
  }

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    sendMessage: sendMessage
  };
})();
