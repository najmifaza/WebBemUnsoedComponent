/* ════════════════════════════════════════
   NUM✕DUEL — script.js (Updated Log Highlight)
════════════════════════════════════════ */
'use strict';

const state = { secrets: { p1: '', p2: '' }, currentTurn: 'p1', log: [], totalGuesses: 0 };
const $ = id => document.getElementById(id);

const phaseSetup = $('phase-setup'), phaseGame = $('phase-game');
const setupP1 = $('setup-p1'), setupP2 = $('setup-p2'), setupTransition = $('setup-transition');
const inputP1 = $('input-p1'), inputP2 = $('input-p2');
const errorP1 = $('error-p1'), errorP2 = $('error-p2');
const btnP1Confirm = $('btn-p1-confirm'), btnPassToP2 = $('btn-pass-to-p2'), btnP2Confirm = $('btn-p2-confirm');
const turnPlayerName = $('turn-player-name'), dotsP1 = $('dots-p1'), dotsP2 = $('dots-p2');
const guessZone = $('guess-zone'), guessPrompt = $('guess-prompt');
const inputGuess = $('input-guess'), errorGuess = $('error-guess'), btnSubmitGuess = $('btn-submit-guess');
const logList = $('log-list'), logCount = $('log-count'), btnResetGame = $('btn-reset-game');
const winScreen = $('win-screen'), winTitle = $('win-title'), winSecret = $('win-secret');
const winStats = $('win-stats'), btnPlayAgain = $('btn-play-again');

const dsP1 = [0, 1, 2].map(i => $('ds-p1-' + i));
const dsP2 = [0, 1, 2].map(i => $('ds-p2-' + i));
const gsSlots = [0, 1, 2].map(i => $('gs-' + i));

function validate(val, errorEl, inputEl) {
  const t = val.trim();
  if (!t) return err(errorEl, inputEl, 'Angka tidak boleh kosong.');
  if (!/^\d{3}$/.test(t)) return err(errorEl, inputEl, 'Tepat 3 digit angka.');
  if (t[0] === t[1] || t[1] === t[2] || t[0] === t[2]) return err(errorEl, inputEl, 'Ketiga angka harus berbeda!');
  clearErr(errorEl, inputEl);
  return true;
}

function err(el, inputEl, msg) { el.textContent = msg; return false; }
function clearErr(el, inputEl) { el.textContent = ''; }

function calcSB(secret, guess) {
  let s = 0, b = 0;
  for (let i = 0; i < 3; i++) {
    if (guess[i] === secret[i]) s++;
    else if (secret.includes(guess[i])) b++;
  }
  return { strikes: s, balls: b };
}

function syncSlots(val, slots, isP2Fill = false) {
  slots.forEach((slot, i) => {
    if (val[i] !== undefined) {
      slot.textContent = val[i];
      slot.classList.add('filled');
      if (isP2Fill) slot.classList.add('p2-filled');
    } else {
      slot.textContent = '_';
      slot.classList.remove('filled', 'p2-filled');
    }
  });
}

inputP1.addEventListener('input', () => { inputP1.value = inputP1.value.replace(/\D/g, ''); syncSlots(inputP1.value, dsP1); });
inputP2.addEventListener('input', () => { inputP2.value = inputP2.value.replace(/\D/g, ''); syncSlots(inputP2.value, dsP2); });
inputGuess.addEventListener('input', () => { inputGuess.value = inputGuess.value.replace(/\D/g, ''); syncSlots(inputGuess.value, gsSlots, state.currentTurn === 'p2'); });

inputP1.addEventListener('keydown', e => { if (e.key === 'Enter') btnP1Confirm.click(); });
inputP2.addEventListener('keydown', e => { if (e.key === 'Enter') btnP2Confirm.click(); });
inputGuess.addEventListener('keydown', e => { if (e.key === 'Enter') btnSubmitGuess.click(); });

function switchScene(hideEl, showEl) {
  hideEl.classList.remove('active');
  hideEl.classList.add('hidden');
  showEl.classList.remove('hidden');
  showEl.classList.add('active');
}

btnP1Confirm.addEventListener('click', () => {
  if (!validate(inputP1.value, errorP1, inputP1)) return;
  state.secrets.p1 = inputP1.value.trim();
  inputP1.value = ''; syncSlots('', dsP1);
  switchScene(setupP1, setupTransition);
});

btnPassToP2.addEventListener('click', () => { switchScene(setupTransition, setupP2); setTimeout(() => inputP2.focus(), 100); });

btnP2Confirm.addEventListener('click', () => {
  if (!validate(inputP2.value, errorP2, inputP2)) return;
  state.secrets.p2 = inputP2.value.trim();
  inputP2.value = ''; syncSlots('', dsP2);
  startGame();
});

function startGame() {
  state.currentTurn = 'p1'; state.log = []; state.totalGuesses = 0;
  logList.innerHTML = '<div class="trail-empty">belum ada tebakan...</div>';
  updateTurnUI(); updateDots(true);
  switchScene(phaseSetup, phaseGame);
  setTimeout(() => inputGuess.focus(), 200);
}

function updateTurnUI() {
  const isP1 = state.currentTurn === 'p1';
  turnPlayerName.textContent = isP1 ? 'PLAYER 1' : 'PLAYER 2';
  turnPlayerName.className = isP1 ? 'tb-name' : 'tb-name p2-turn';
  guessPrompt.textContent = `Tebak angka rahasia ${isP1 ? 'Player 2' : 'Player 1'}:`;
  inputGuess.value = ''; syncSlots('', gsSlots); clearErr(errorGuess, inputGuess);
  inputGuess.focus();
}

function updateDots(reset = false) {
  if (reset) {
    document.querySelectorAll('.pdot').forEach(d => d.className = 'pdot');
    return;
  }
  const countP1 = countStrikes('p1');
  dotsP1.querySelectorAll('.pdot').forEach((dot, i) => { if (i < countP1) dot.classList.add('filled-p1'); });
  const countP2 = countStrikes('p2');
  dotsP2.querySelectorAll('.pdot').forEach((dot, i) => { if (i < countP2) dot.classList.add('filled-p2'); });
}

function countStrikes(player) {
  return Math.min(3, state.log.filter(e => e.player === player).reduce((acc, curr) => acc + curr.strikes, 0));
}

btnSubmitGuess.addEventListener('click', () => {
  const val = inputGuess.value;
  if (!validate(val, errorGuess, inputGuess)) return;

  const guess = val.trim(), player = state.currentTurn;
  const secret = player === 'p1' ? state.secrets.p2 : state.secrets.p1;
  const { strikes, balls } = calcSB(secret, guess);

  state.log.push({ player, guess, strikes, balls });
  state.totalGuesses++; updateDots(); appendLog({ player, guess, strikes, balls });
  logCount.textContent = state.totalGuesses + ' tebakan';

  if (strikes === 3) { showWin(player); return; }
  state.currentTurn = player === 'p1' ? 'p2' : 'p1';
  updateTurnUI();
});

function appendLog({ player, guess, strikes, balls }) {
  if (logList.querySelector('.trail-empty')) logList.innerHTML = '';
  const item = document.createElement('div');
  item.className = `log-item log-${player}`;

  // Highlight warna tetap (S=Oranye, B=Biru) bahkan jika 0
  item.innerHTML = `
    <div style="display:flex; align-items:center;">
      <span class="log-player-badge badge-${player}">${player.toUpperCase()}</span>
      <span class="log-guess">${guess[0]} ${guess[1]} ${guess[2]}</span>
    </div>
    <div class="log-result">
      <span class="res-s">${strikes}S</span>
      <span class="res-b">${balls}B</span>
    </div>`;
  logList.appendChild(item);
  logList.scrollTop = logList.scrollHeight;
}

function showWin(winner) {
  const isP1 = winner === 'p1';
  winTitle.textContent = isP1 ? 'PLAYER 1' : 'PLAYER 2';
  winSecret.textContent = (isP1 ? state.secrets.p2 : state.secrets.p1).split('').join(' · ');
  winStats.textContent = `Selesai dalam ${state.totalGuesses} total tebakan`;
  winScreen.classList.remove('hidden');
}

[btnPlayAgain, btnResetGame].forEach(btn => btn.addEventListener('click', () => {
  winScreen.classList.add('hidden');
  inputP1.value = ''; inputP2.value = '';
  switchScene(setupP2, setupP1);
  switchScene(setupTransition, setupP1);
  switchScene(phaseGame, phaseSetup);
}));