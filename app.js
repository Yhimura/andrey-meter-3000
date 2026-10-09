// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    console.log("TG WebApp init error", e);
  }
}

// Состояние приложения
const state = {
  pinchCount: 0,
  rageLevel: 0, // от 0 до 100%
  selectedOffenses: [],
  currentPenalty: null
};

// Самоироничные фразы Андрея для Маруси
const andreyQuotes = [
  "Ай! Маруся, понял, заслужил! 🥺",
  "Щип принят! Я правда всё осознал!",
  "Ой! Ладно, щипай сколько нужно, лишь бы тебе полегчало!",
  "Маруся, прости зануду! 🙈",
  "Ай-ай! Признаю свою неправоту!",
  "Я правда тупанул, обещаю исправиться!",
  "Обещаю больше не бесить и не умничать!",
  "Уже думаю, какую вкусняшку передать, чтобы загладить вину 🍫",
  "Ай! Надеюсь, тебе хоть чуточку стало легче!",
  "Всё, всё, молчу и внимательно слушаю! 🫡",
  "Маруся, мир? Я готов к исправительным работам!"
];

// Уровни шкалы
const rageStages = [
  { threshold: 0, label: "Уровень: Ангельское терпение 😇" },
  { threshold: 20, label: "Уровень: Слегка выбесил 😒" },
  { threshold: 45, label: "Уровень: Опять этот Андрей... 😤" },
  { threshold: 70, label: "Уровень: Максимальное возмущение ⚡" },
  { threshold: 95, label: "КРИТИЧЕСКИЙ: Требуются вкусняшки и извинения! 🚨" }
];

// Штрафы для искупления вины
const penalties = [
  {
    icon: "☕",
    title: "Любимый кофе и десерт",
    desc: "Андрей обязан доставить любимый напиток и сладость для поднятия твоего настроения."
  },
  {
    icon: "🍣",
    title: "Партия роллов или пиццы",
    desc: "Ужин за счёт провинившегося Андрея без лишних разговоров."
  },
  {
    icon: "🤐",
    title: "Режим «Маруся права во всём»",
    desc: "Андрей соглашается со всеми твоими аргументами и держит своё занудство при себе."
  },
  {
    icon: "🍫",
    title: "Срочная порция сладкого",
    desc: "Доставка любимого шоколада или вкусняшек в кратчайшие сроки."
  },
  {
    icon: "🎵",
    title: "Смешное оправдание от Андрея",
    desc: "Андрей обязуется рассказать самую нелепую историю из своей жизни, чтобы рассмешить тебя."
  }
];

// Элементы DOM
const characterPinchZone = document.getElementById("characterPinchZone");
const andreyCharacter = document.getElementById("andreyCharacter");
const speechBubble = document.getElementById("speechBubble");
const speechText = document.getElementById("speechText");
const rippleContainer = document.getElementById("rippleContainer");
const pinchCounter = document.getElementById("pinchCounter");
const ragePercent = document.getElementById("ragePercent");
const meterBarFill = document.getElementById("meterBarFill");
const rageStatusLabel = document.getElementById("rageStatusLabel");

const characterMouth = document.getElementById("characterMouth");

// Навигация
const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

// Штрафы
const btnRollPenalty = document.getElementById("btnRollPenalty");
const penaltyResultCard = document.getElementById("penaltyResultCard");
const penaltyIcon = document.getElementById("penaltyIcon");
const penaltyTitle = document.getElementById("penaltyTitle");
const penaltyDesc = document.getElementById("penaltyDesc");
const btnSharePenalty = document.getElementById("btnSharePenalty");
const customOffenseInput = document.getElementById("customOffenseInput");

// Пар
const ventText = document.getElementById("ventText");
const btnBurnVent = document.getElementById("btnBurnVent");
const burnResult = document.getElementById("burnResult");

// Перемирие
const btnQuickForgive = document.getElementById("btnQuickForgive");
const forgiveModal = document.getElementById("forgiveModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const modalPinchStats = document.getElementById("modalPinchStats");
const btnShareForgiveness = document.getElementById("btnShareForgiveness");

// Web Audio API: синтезатор звука щипка
let audioCtx = null;
function playCutePinchSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const baseFreq = 540 + Math.random() * 180;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.13);
  } catch (err) {}
}

// Telegram Haptic Feedback
function triggerHaptic(type = "medium") {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(type);
  } else if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

// Эффект вылетающих частиц
function spawnPinchParticle(x, y) {
  const particles = ["🤏", "🤏", "✨", "💫", "🕊️", "🌸", "🥺"];
  const char = particles[Math.floor(Math.random() * particles.length)];
  
  const span = document.createElement("span");
  span.className = "pinch-particle";
  span.textContent = char;

  const rect = rippleContainer.getBoundingClientRect();
  const relX = x ? x - rect.left : rect.width / 2;
  const relY = y ? y - rect.top : rect.height / 2;

  span.style.left = `${relX}px`;
  span.style.top = `${relY}px`;

  const tx = (Math.random() - 0.5) * 80;
  const rot = (Math.random() - 0.5) * 60;
  span.style.setProperty("--tx", `${tx}px`);
  span.style.setProperty("--rot", `${rot}deg`);

  rippleContainer.appendChild(span);

  setTimeout(() => {
    span.remove();
  }, 750);
}

// Обработка щипка
function handlePinch(e) {
  state.pinchCount++;
  if (state.rageLevel < 100) {
    state.rageLevel = Math.min(100, state.rageLevel + 6);
  }

  pinchCounter.textContent = state.pinchCount;
  updateRageMeterUI();

  playCutePinchSound();
  triggerHaptic(state.rageLevel > 70 ? "heavy" : "medium");

  // Анимация щипка
  andreyCharacter.classList.remove("is-pinched");
  void andreyCharacter.offsetWidth;
  andreyCharacter.classList.add("is-pinched");

  // Реакция лица
  if (characterMouth) {
    characterMouth.setAttribute("d", "M 92 124 Q 100 114 108 124");
  }
  setTimeout(() => {
    if (characterMouth) {
      characterMouth.setAttribute("d", "M 92 118 Q 100 126 108 118");
    }
  }, 350);

  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  spawnPinchParticle(clientX, clientY);

  const randomQuote = andreyQuotes[Math.floor(Math.random() * andreyQuotes.length)];
  speechText.textContent = randomQuote;

  speechBubble.style.transform = "scale(1.04)";
  setTimeout(() => {
    speechBubble.style.transform = "scale(1)";
  }, 150);
}

// Обновление UI шкалы
function updateRageMeterUI() {
  ragePercent.textContent = `${state.rageLevel}%`;
  meterBarFill.style.width = `${state.rageLevel}%`;

  let currentStage = rageStages[0];
  for (let i = rageStages.length - 1; i >= 0; i--) {
    if (state.rageLevel >= rageStages[i].threshold) {
      currentStage = rageStages[i];
      break;
    }
  }
  rageStatusLabel.textContent = currentStage.label;
}

characterPinchZone.addEventListener("pointerdown", handlePinch);

// Вкладки
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    triggerHaptic("light");
    tabBtns.forEach(b => b.classList.remove("active"));
    tabPanes.forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    const targetId = btn.getAttribute("data-tab");
    const pane = document.getElementById(targetId);
    if (pane) pane.classList.add("active");
  });
});

// Назначение штрафа
btnRollPenalty.addEventListener("click", () => {
  triggerHaptic("medium");

  const checkedBoxes = document.querySelectorAll('.offense-item input[type="checkbox"]:checked');
  const selectedReasons = Array.from(checkedBoxes).map(cb => cb.value);
  const customReason = customOffenseInput.value.trim();
  if (customReason) {
    selectedReasons.push(customReason);
  }

  state.selectedOffenses = selectedReasons;

  const randomPenalty = penalties[Math.floor(Math.random() * penalties.length)];
  state.currentPenalty = randomPenalty;

  penaltyIcon.textContent = randomPenalty.icon;
  penaltyTitle.textContent = randomPenalty.title;
  penaltyDesc.textContent = randomPenalty.desc;

  penaltyResultCard.classList.remove("hidden");
  penaltyResultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// Отправка штрафа Андрею
btnSharePenalty.addEventListener("click", () => {
  triggerHaptic("heavy");
  if (!state.currentPenalty) return;

  let msg = `📜 Официальное постановление от Маруси!\n`;
  if (state.selectedOffenses.length > 0) {
    msg += `\n🔍 В чём провинился Андрей:\n` + state.selectedOffenses.map(r => `• ${r}`).join("\n") + `\n`;
  }
  msg += `\n⚖️ НАЗНАЧЕНО НАКАЗАНИЕ:\n`;
  msg += `${state.currentPenalty.icon} ${state.currentPenalty.title}\n`;
  msg += `"${state.currentPenalty.desc}"\n\n`;
  msg += `Ущипнут: ${state.pinchCount} раз(а) 🤏\n`;
  msg += `Андрей, приговор обжалованию не подлежит! 🙂`;

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(msg)}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, "_blank");
  }
});

// Сжигание / выпуск пара
btnBurnVent.addEventListener("click", () => {
  const text = ventText.value.trim();
  if (!text) {
    ventText.placeholder = "Напиши хотя бы пару слов! 🙂";
    ventText.focus();
    triggerHaptic("warning");
    return;
  }

  triggerHaptic("heavy");
  playCutePinchSound();

  ventText.value = "";
  burnResult.classList.remove("hidden");
  burnResult.scrollIntoView({ behavior: "smooth", block: "nearest" });

  state.rageLevel = Math.max(0, state.rageLevel - 40);
  updateRageMeterUI();
});

// Перемирие
btnQuickForgive.addEventListener("click", () => {
  triggerHaptic("medium");
  modalPinchStats.textContent = `${state.pinchCount} раз(а)`;
  forgiveModal.classList.remove("hidden");
});

btnCloseModal.addEventListener("click", () => {
  triggerHaptic("light");
  forgiveModal.classList.add("hidden");
});

// Отправка перемирия
btnShareForgiveness.addEventListener("click", () => {
  triggerHaptic("heavy");
  const msg = `🤝 Акт о перемирии с Андреем!\n\n` +
    `Маруся сменила гнев на милость.\n` +
    `Андрей получил ${state.pinchCount} щипков 🤏 и обещает больше не косячить.\n` +
    `С Андрея причитаются вкусняшки и мирное общение! ✨`;

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(msg)}`;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, "_blank");
  }
});
