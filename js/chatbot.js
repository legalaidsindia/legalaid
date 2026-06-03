/**
 * ==========================================================================
 * LegalAidIndia.org — AI Legal Assistant Chatbot
 * ==========================================================================
 *
 * Keyword-based chatbot UI tailored for Indian legal queries.
 * Selectors matched to index.html IDs and components.css BEM classes.
 *
 * @version 2.0.0
 */

'use strict';

/* -----------------------------------------------------------------------
   1. Chat State
   ----------------------------------------------------------------------- */

const ChatState = {
  messages: [],
  isTyping: false,
  currentLanguage: localStorage.getItem('legalaid-lang') || 'English',
};

/* -----------------------------------------------------------------------
   2. Response Library
   ----------------------------------------------------------------------- */

const RESPONSES = {
  greetings: [
    "Hello! I'm your AI Legal Assistant from LegalAidIndia. I can help you with questions about Indian law — from fundamental rights to filing an FIR. How can I assist you today?",
    "Namaste! Welcome to LegalAidIndia's AI Legal Assistant. Feel free to ask me anything about your legal rights, filing complaints, or navigating the Indian legal system.",
    "Hi there! I'm here to provide guidance on Indian legal matters. I can help with RTI applications, consumer complaints, property disputes, and much more. What do you need help with?",
  ],

  rights: [
    "🇮🇳 **Fundamental Rights (Articles 12-35)**\n\nEvery Indian citizen is guaranteed:\n• **Right to Equality** (Art. 14-18) — Equal protection before law\n• **Right to Freedom** (Art. 19-22) — Speech, assembly, movement, profession\n• **Right against Exploitation** (Art. 23-24) — Prohibition of forced/child labour\n• **Right to Freedom of Religion** (Art. 25-28)\n• **Cultural & Educational Rights** (Art. 29-30)\n• **Right to Constitutional Remedies** (Art. 32) — Approach Supreme Court directly\n\nWould you like details on any specific right?",
    "Under the **Consumer Protection Act, 2019**, you have the right to:\n• Safety from hazardous goods\n• Full information about product quality & price\n• Choose from a range of products at competitive prices\n• Be heard in consumer forums\n• Seek redressal against unfair trade practices\n• Consumer education\n\nYou can file complaints at the **National Consumer Helpline (1800-11-4000)** or through the **e-Daakhil** portal (edaakhil.nic.in).",
    "**Tenant Rights in India:**\n• Right to a written rental agreement\n• Protection against arbitrary eviction (landlord must give proper notice)\n• Right to essential services (water, electricity)\n• Security deposit refund (as per state Rent Control Act)\n• Right to privacy — landlord cannot enter without notice\n• Protection under the **Model Tenancy Act, 2021**\n\nRights vary by state. Shall I provide state-specific information?",
  ],

  fir: [
    "📋 **How to File an FIR (First Information Report):**\n\n1. **Visit the nearest police station** — FIR must be filed at the station with jurisdiction\n2. **Provide details** — Describe the incident clearly: what, when, where, who\n3. **Get it written** — The officer must record your complaint; you can dictate in any language\n4. **Read & sign** — Verify the written FIR before signing\n5. **Collect your copy** — You are legally entitled to a free copy (Section 154 CrPC)\n\n**Important:**\n• Police **cannot refuse** to file an FIR for cognizable offences (Supreme Court ruling)\n• If refused, complain to the **SP/Commissioner** or file via **e-FIR portals**\n• Zero FIR: You can file at *any* police station; it will be transferred later\n• For women: Female officers should handle complaints involving women\n\nNeed help drafting the complaint text?",
  ],

  rti: [
    "📄 **How to File an RTI Application:**\n\n**Step 1 — Write the Application**\n• Address it to the **Public Information Officer (PIO)** of the relevant department\n• State clearly: \"I wish to seek information under the Right to Information Act, 2005\"\n• List your questions — be specific and clear\n\n**Step 2 — Pay the Fee**\n• Central Govt: ₹10 (by postal order, DD, or online)\n• BPL applicants: Free (attach proof)\n\n**Step 3 — Submit**\n• **Online:** rtionline.gov.in (for central ministries)\n• **Offline:** Send by post or submit in person\n\n**Step 4 — Response**\n• PIO must respond within **30 days** (48 hours if life/liberty is at stake)\n• If denied → **First Appeal** to the senior officer within 30 days\n• Still unsatisfied → **Second Appeal** to the Information Commission\n\nWould you like a ready-made RTI template?",
  ],

  divorce: [
    "⚖️ **Divorce Process in India — Overview:**\n\n**Mutual Consent Divorce (Section 13B, Hindu Marriage Act):**\n1. Joint petition by both spouses\n2. First motion → Court records statements\n3. **6-month cooling-off period** (can be waived by Supreme Court precedent)\n4. Second motion → Final hearing\n5. Decree of divorce granted\n\n**Contested Divorce:**\nFiled on grounds such as cruelty, adultery, desertion (2+ years), mental disorder, or conversion.\n• Filing → Service of notice → Response → Evidence → Arguments → Judgment\n• Can take **1-5 years** depending on complexity\n\n**Key Points:**\n• Alimony/maintenance is determined by court based on income & needs\n• Child custody follows the **welfare of the child** principle\n• Different personal laws apply (Hindu, Muslim, Christian, Special Marriage Act)\n\nShall I explain maintenance rights or child custody in detail?",
  ],

  property: [
    "🏠 **Property Dispute Guidance:**\n\n**Common Types:**\n• Title disputes & ownership claims\n• Boundary & encroachment issues\n• Landlord-tenant disagreements\n• Ancestral property partition\n• Builder-buyer conflicts (RERA)\n\n**Steps to Resolve:**\n1. **Verify documents** — Check sale deed, title deed, encumbrance certificate, mutation records\n2. **Attempt mediation** — Lok Adalat or mediation centre (free, faster)\n3. **Send legal notice** — Through a lawyer, giving reasonable time to respond\n4. **File a civil suit** — In the appropriate civil court with jurisdiction\n5. **RERA complaint** — For real estate issues, file at your state RERA authority\n\n**Documents to Keep Ready:**\n• Sale/gift/partition deed\n• Property tax receipts\n• Encumbrance certificate (last 30 years)\n• Mutation record / 7/12 extract\n\nWant help understanding your specific property issue?",
  ],

  labor: [
    "👷 **Employment & Labour Law Basics:**\n\n**Key Protections:**\n• **Minimum Wages Act** — Employers must pay at least the state/central minimum wage\n• **Payment of Wages Act** — Salary must be paid by the 7th/10th of each month\n• **Employees' PF** — Mandatory for establishments with 20+ employees\n• **Gratuity Act** — 15 days' wages per year of service after 5 years\n• **Maternity Benefit Act** — 26 weeks paid leave for first two children\n• **POSH Act, 2013** — Protection against workplace sexual harassment\n\n**If Wrongfully Terminated:**\n1. Collect appointment letter, salary slips, termination notice\n2. File complaint with **Labour Commissioner**\n3. Approach the **Labour Court / Industrial Tribunal**\n4. Can also file under the **Industrial Disputes Act**\n\n**New Labour Codes (2020):**\nFour new codes consolidating 29 laws — covering wages, social security, industrial relations, and occupational safety.\n\nNeed help filing a labour complaint?",
  ],

  consumer: [
    "🛒 **Consumer Complaint Process:**\n\n**Step 1 — Try Direct Resolution**\nContact the seller/service provider in writing. Keep proof.\n\n**Step 2 — File on e-Daakhil Portal**\nVisit **edaakhil.nic.in** — fully online process\n\n**Step 3 — Choose the Right Forum:**\n• **District Commission** — Claims up to ₹1 crore\n• **State Commission** — ₹1 crore to ₹10 crore\n• **National Commission** — Above ₹10 crore\n\n**Step 4 — Prepare Your Complaint**\n• Details of purchase (invoice, warranty card)\n• Nature of defect / deficiency in service\n• Copies of correspondence with the seller\n• Relief sought (replacement, refund, compensation)\n\n**Step 5 — Hearing & Order**\nUsually resolved within **3-5 months** in District Forums\n\n**Helpline:** National Consumer Helpline — **1800-11-4000** (toll-free)\n\nWould you like help drafting a consumer complaint?",
  ],

  legal_aid: [
    "🆓 **Free Legal Aid in India:**\n\nUnder **Article 39A** and the **Legal Services Authorities Act, 1987**, free legal aid is available to:\n• Women and children\n• SC/ST members\n• Industrial workmen\n• Persons with disabilities\n• Victims of trafficking\n• Persons in custody\n• Anyone with annual income below ₹3 lakh (High Court) / ₹5 lakh (Supreme Court)\n\n**How to Apply:**\n1. Visit your **District Legal Services Authority (DLSA)**\n2. Apply online at **nalsa.gov.in**\n3. Call the **NALSA helpline: 15100**\n4. Visit any **Lok Adalat** for dispute settlement\n\nFree legal aid includes a lawyer at no cost, court fee waiver, and preparation of legal documents.",
  ],

  default: [
    "I can help you with a wide range of Indian legal topics:\n\n• 📜 **Know Your Rights** — Fundamental, consumer, tenant rights\n• 📋 **File an FIR** — Step-by-step guidance\n• 📄 **RTI Application** — How to seek information from the government\n• ⚖️ **Divorce & Family Law**\n• 🏠 **Property Disputes**\n• 👷 **Labour & Employment Law**\n• 🛒 **Consumer Complaints**\n• 🆓 **Free Legal Aid**\n\nPlease type your question or tap one of the quick-action buttons below!",
    "I'm here to help with your legal queries. Could you provide a bit more detail about your situation? You can also use the quick-action buttons for common topics like FIR filing, RTI applications, or knowing your rights.",
  ],
};

/* -----------------------------------------------------------------------
   3. Keyword Matching
   ----------------------------------------------------------------------- */

const KEYWORD_MAP = [
  { keywords: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'greetings'], category: 'greetings' },
  { keywords: ['fir', 'first information report', 'police complaint', 'police report', 'lodge complaint', 'file complaint police'], category: 'fir' },
  { keywords: ['rti', 'right to information', 'information act', 'public information'], category: 'rti' },
  { keywords: ['divorce', 'separation', 'marriage dissolution', 'alimony', 'maintenance', 'child custody'], category: 'divorce' },
  { keywords: ['property', 'land dispute', 'encroachment', 'title deed', 'real estate', 'rera', 'builder', 'tenant', 'rent', 'landlord', 'eviction'], category: 'property' },
  { keywords: ['labour', 'labor', 'employment', 'wages', 'salary', 'termination', 'fired', 'pf', 'provident fund', 'gratuity', 'maternity', 'posh', 'harassment workplace'], category: 'labor' },
  { keywords: ['consumer', 'refund', 'defective product', 'warranty', 'e-daakhil', 'consumer forum', 'complaint product'], category: 'consumer' },
  { keywords: ['rights', 'fundamental rights', 'my rights', 'citizen rights', 'know my rights', 'constitutional rights'], category: 'rights' },
  { keywords: ['legal aid', 'free lawyer', 'free legal', 'nalsa', 'lok adalat', 'pro bono'], category: 'legal_aid' },
];

function matchCategory(input) {
  const normalised = input.toLowerCase().trim();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((kw) => normalised.includes(kw))) {
      return category;
    }
  }
  return 'default';
}

function getResponse(category) {
  const pool = RESPONSES[category] || RESPONSES.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* -----------------------------------------------------------------------
   4. Render Message — uses CSS classes from components.css
   ----------------------------------------------------------------------- */

/**
 * Create a chat bubble and append it to #chat-messages.
 * @param {string} text   — supports **bold** markdown
 * @param {'user'|'bot'} sender
 */
function renderMessage(text, sender = 'bot') {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  ChatState.messages.push({ text, sender, timestamp: Date.now() });

  const bubble = document.createElement('div');
  // BEM classes matching components.css: .chat-msg .msg-user / .msg-bot
  bubble.className = sender === 'user' ? 'chat-msg msg-user' : 'chat-msg msg-bot';

  // Format **bold** and newlines
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (sender === 'bot') {
    bubble.innerHTML = `
      <span class="msg-label">AI Assistant</span>
      <div>${formatted}</div>
      <span class="chat-msg__time">${timeStr}</span>
    `;
  } else {
    bubble.innerHTML = `
      <div>${formatted}</div>
      <span class="chat-msg__time">${timeStr}</span>
    `;
  }

  bubble.setAttribute('role', 'log');
  bubble.setAttribute('aria-live', 'polite');

  container.appendChild(bubble);
  scrollToBottom(container);
}

function scrollToBottom(container) {
  requestAnimationFrame(() => {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  });
}

/* -----------------------------------------------------------------------
   5. Typing Indicator — uses .chat-typing and .chat-typing__dot from CSS
   ----------------------------------------------------------------------- */

function showTypingIndicator() {
  return new Promise((resolve) => {
    const container = document.getElementById('chat-messages');
    if (!container) { resolve(); return; }

    ChatState.isTyping = true;

    const indicator = document.createElement('div');
    indicator.className = 'chat-typing';
    indicator.setAttribute('aria-label', 'Assistant is typing');
    indicator.innerHTML = `
      <span class="chat-typing__dot"></span>
      <span class="chat-typing__dot"></span>
      <span class="chat-typing__dot"></span>
    `;

    container.appendChild(indicator);
    scrollToBottom(container);

    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      indicator.remove();
      ChatState.isTyping = false;
      resolve();
    }, delay);
  });
}

async function handleSend(overrideText) {
  const input = document.getElementById('chat-input');
  const text = (overrideText || (input ? input.value : '')).trim();

  if (!text || ChatState.isTyping) return;

  renderMessage(text, 'user');

  if (input && !overrideText) {
    input.value = '';
    input.focus();
  }

  await showTypingIndicator();

  // Try to connect to local Nyaya-GPT REST API (Flask server)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        use_ollama: false // By default use Groq; user can override or expand this config
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        renderMessage(data.reply, 'bot');
        return;
      } else if (data.error) {
        console.error('Backend returned error:', data.error);
      }
    }
  } catch (err) {
    console.warn('Nyaya-GPT backend API is offline or timed out. Falling back to local simulations.', err);
  }

  // Graceful simulated fallback
  const category = matchCategory(text);
  const reply = getResponse(category);
  renderMessage(reply, 'bot');
}

/* -----------------------------------------------------------------------
   7. Quick Action Chips — uses .chip class with data-action
   ----------------------------------------------------------------------- */

function initQuickActions() {
  const chips = document.querySelectorAll('.chip[data-action]');

  const chipMessages = {
    fir:       'How do I file an FIR?',
    rights:    'Tell me about my fundamental rights',
    lawyer:    'How can I find a lawyer or get free legal aid?',
    rti:       'How do I file an RTI application?',
    divorce:   'What is the divorce process in India?',
    property:  'Help with a property dispute',
    consumer:  'I want to file a consumer complaint',
    labor:     'What are my employment rights?',
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const action = chip.dataset.action;
      const message = chipMessages[action] || chip.textContent.trim();
      handleSend(message);
    });
  });
}

/* -----------------------------------------------------------------------
   8. Input Handlers — #chat-input and #chat-send-btn
   ----------------------------------------------------------------------- */

function initInputHandlers() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => handleSend());
  }
}

/* -----------------------------------------------------------------------
   9. Welcome Message & Init
   ----------------------------------------------------------------------- */

function showWelcomeMessage() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  renderMessage(
    "Welcome to **LegalAidIndia AI Assistant**! 🇮🇳\n\nI can help you understand your legal rights, guide you through filing an FIR or RTI, explain divorce or property laws, and much more — all tailored to Indian law.\n\nHow can I help you today?",
    'bot'
  );
}

/** Listen for language changes from main.js */
document.addEventListener('languageChange', (e) => {
  ChatState.currentLanguage = e.detail.language;
});

/* -----------------------------------------------------------------------
   Bootstrap
   ----------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initInputHandlers();
  initQuickActions();
  showWelcomeMessage();
});
