// ========================
// WHOT CARD GAME ENGINE
// ========================

const SHAPES = ['circle', 'triangle', 'cross', 'square', 'star'];
const SHAPE_ICONS = { circle: '⭕', triangle: '🔺', cross: '✚', square: '🟦', star: '⭐', whot: '🌈' };
const SHAPE_LABELS = { circle: 'Circle', triangle: 'Triangle', cross: 'Cross', square: 'Square', star: 'Star', whot: 'WHOT' };

const NUMS = [1,2,3,3,4,4,5,5,5,7,7,8,8,10,10,11,11,12,12,13,13,14,14];

const WHOT_CARD      = 20;
const HOLD_ON        = 1;
const PICK_TWO       = 5;
const SUSPENSION     = 8;
const GENERAL_MARKET = 14;

const DIFF_LABELS = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };

// ---- Deck ----
function buildDeck() {
  const deck = [];
  SHAPES.forEach(shape => {
    NUMS.forEach(num => deck.push({ shape, num }));
  });
  for (let i = 0; i < 5; i++) deck.push({ shape: 'whot', num: WHOT_CARD });
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Game state ----
let deck, playerHand, cpuHand, pile, topCard, playerTurn, calledShape, gameOver, waitingCallNo;
let difficulty = 'medium';

// ---- Init ----
function initGame() {
  deck = shuffle(buildDeck());
  playerHand = [];
  cpuHand = [];
  pile = [];
  calledShape = null;
  gameOver = false;
  waitingCallNo = false;

  for (let i = 0; i < 5; i++) {
    playerHand.push(deck.pop());
    cpuHand.push(deck.pop());
  }

  let starter;
  do { starter = deck.pop(); } while (
    starter.num === WHOT_CARD ||
    starter.num === HOLD_ON ||
    starter.num === PICK_TWO ||
    starter.num === GENERAL_MARKET
  );
  pile.push(starter);
  topCard = starter;
  playerTurn = true;

  document.getElementById('end-actions').style.display = 'none';
  document.getElementById('call-no-area').style.display = 'none';
  syncDifficultyButtons();
  renderGame();
  setMessage("Your turn! Play a card.");
}

// ---- Card logic ----
function cardCanPlay(card) {
  const effective = calledShape || topCard.shape;
  if (card.shape === 'whot') return true;
  if (card.shape === effective) return true;
  if (card.num === topCard.num && topCard.shape !== 'whot') return true;
  return false;
}

function cardHTML(card, idx, isPlayer) {
  const div = document.createElement('div');
  div.className = 'card ' + card.shape;
  if (isPlayer && cardCanPlay(card)) div.classList.add('playable');

  const numText = card.shape === 'whot' ? 'WHOT' : card.num;

  const topLeft = document.createElement('div');
  topLeft.className = 'card-corner top-left';
  topLeft.textContent = numText;

  const bottomRight = document.createElement('div');
  bottomRight.className = 'card-corner bottom-right';
  bottomRight.textContent = numText;

  div.appendChild(topLeft);
  div.appendChild(bottomRight);

  if (isPlayer) {
    div.addEventListener('click', () => playerPlayCard(idx));
    div.title = SHAPE_LABELS[card.shape] + (card.shape === 'whot' ? '' : ' ' + card.num);
  }
  return div;
}

function renderTopCard() {
  const tc = document.getElementById('top-card');
  tc.className = 'card ' + topCard.shape;
  tc.innerHTML = '';

  const numText = topCard.shape === 'whot' ? 'WHOT' : topCard.num;

  const topLeft = document.createElement('div');
  topLeft.className = 'card-corner top-left';
  topLeft.textContent = numText;

  const bottomRight = document.createElement('div');
  bottomRight.className = 'card-corner bottom-right';
  bottomRight.textContent = numText;

  tc.appendChild(topLeft);
  tc.appendChild(bottomRight);

  if (calledShape) {
    const called = document.createElement('div');
    called.className = 'card-called';
    called.textContent = '→ ' + SHAPE_LABELS[calledShape];
    tc.appendChild(called);
  }
}

function renderGame() {
  document.getElementById('cpu-count').textContent = 'CPU: ' + cpuHand.length + ' card' + (cpuHand.length !== 1 ? 's' : '');
  document.getElementById('deck-count').textContent = 'Deck: ' + deck.length;
  document.getElementById('turn-label').textContent = playerTurn ? '🟡 Your turn' : "🔴 CPU's turn";
  document.getElementById('diff-badge').textContent = DIFF_LABELS[difficulty];

  renderTopCard();

  const handDiv = document.getElementById('player-hand');
  handDiv.innerHTML = '';
  playerHand.forEach((card, idx) => handDiv.appendChild(cardHTML(card, idx, true)));

  document.getElementById('draw-btn').disabled = !playerTurn || gameOver;
}

function setMessage(msg) {
  document.getElementById('message').textContent = msg;
}

// ---- Player actions ----
function playerPlayCard(idx) {
  if (!playerTurn || gameOver || waitingCallNo) return;
  const card = playerHand[idx];
  if (!cardCanPlay(card)) { setMessage('That card cannot be played now.'); return; }
  playerHand.splice(idx, 1);
  applyCard(card, 'player');
}

function applyCard(card, who) {
  pile.push(card);
  topCard = card;
  calledShape = null;

  const opponent = who === 'player' ? 'cpu' : 'player';
  const hand = who === 'player' ? playerHand : cpuHand;

  if (hand.length === 0) {
    renderGame();
    setMessage(who === 'player' ? 'You win! Whot!' : 'CPU wins! Better luck next time.');
    gameOver = true;
    document.getElementById('end-actions').style.display = 'block';
    return;
  }

  if (card.num === WHOT_CARD) {
    if (who === 'player') {
      waitingCallNo = true;
      showCallNo();
      return;
    } else {
      calledShape = cpuPickShape();
      setMessage('CPU plays WHOT and calls: ' + SHAPE_LABELS[calledShape]);
    }
  } else if (card.num === HOLD_ON) {
    setMessage(who === 'player' ? 'Hold On! Play again.' : 'CPU plays Hold On and goes again.');
    renderGame();
    if (who === 'cpu') { setTimeout(cpuTurn, 800); return; }
    return;
  } else if (card.num === PICK_TWO) {
    drawCards(opponent, 2);
    setMessage(who === 'player' ? 'CPU draws 2 cards.' : 'Pick Two! You draw 2 cards.');
  } else if (card.num === GENERAL_MARKET) {
    drawCards(opponent, 1);
    setMessage(who === 'player' ? 'General Market: CPU draws 1.' : 'General Market: You draw 1 card.');
  } else if (card.num === SUSPENSION) {
    setMessage(who === 'player' ? 'CPU is suspended. Play again!' : 'Suspension! CPU plays again.');
    renderGame();
    if (who === 'cpu') { setTimeout(cpuTurn, 800); return; }
    return;
  } else {
    setMessage(who === 'player' ? "Nice move! CPU's turn." : 'CPU played. Your turn.');
  }

  playerTurn = (who === 'cpu');
  renderGame();
  if (!playerTurn && !gameOver) setTimeout(cpuTurn, 900);
}

function drawCards(who, count) {
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) reshufflePile();
    if (deck.length === 0) break;
    if (who === 'player') playerHand.push(deck.pop());
    else cpuHand.push(deck.pop());
  }
}

function reshufflePile() {
  if (pile.length <= 1) return;
  const top = pile.pop();
  deck = shuffle(pile);
  pile = [top];
  setMessage('Deck reshuffled from pile.');
}

// ---- WHOT shape call UI ----
function showCallNo() {
  const area = document.getElementById('call-no-area');
  const btns = document.getElementById('call-no-btns');
  btns.innerHTML = '';
  area.style.display = 'block';
  SHAPES.forEach(shape => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = SHAPE_ICONS[shape] + ' ' + SHAPE_LABELS[shape];
    b.style.background = '#1565c0';
    b.addEventListener('click', () => {
      calledShape = shape;
      area.style.display = 'none';
      waitingCallNo = false;
      setMessage('You called: ' + SHAPE_LABELS[shape] + ". CPU's turn.");
      playerTurn = false;
      renderGame();
      setTimeout(cpuTurn, 900);
    });
    btns.appendChild(b);
  });
}

// ========== CPU LOGIC ==========

function cpuPickShape() {
  const counts = {};
  SHAPES.forEach(s => { counts[s] = 0; });
  cpuHand.forEach(c => { if (counts[c.shape] !== undefined) counts[c.shape]++; });

  if (difficulty === 'hard') {
    const playerCounts = {};
    SHAPES.forEach(s => { playerCounts[s] = 0; });
    playerHand.forEach(c => { if (playerCounts[c.shape] !== undefined) playerCounts[c.shape]++; });
    return SHAPES.reduce((best, s) =>
      (counts[s] * 2 - playerCounts[s]) >= (counts[best] * 2 - playerCounts[best]) ? s : best
    );
  }

  return SHAPES.reduce((a, b) => counts[a] >= counts[b] ? a : b);
}

function cpuTurn() {
  if (gameOver) return;
  const playable = cpuHand.map((c, i) => ({ c, i })).filter(({ c }) => cardCanPlay(c));

  if (playable.length === 0) {
    drawCards('cpu', 1);
    const drawn = cpuHand[cpuHand.length - 1];

    if (difficulty === 'hard' && drawn && cardCanPlay(drawn)) {
      cpuHand.splice(cpuHand.length - 1, 1);
      setMessage('CPU drew a card and plays it: ' + SHAPE_LABELS[drawn.shape] + (drawn.shape === 'whot' ? '' : ' ' + drawn.num));
      applyCard(drawn, 'cpu');
      return;
    }

    setMessage('CPU drew a card. Your turn.');
    playerTurn = true;
    renderGame();
    return;
  }

  let chosen;

  if (difficulty === 'easy') {
    chosen = playable[Math.floor(Math.random() * playable.length)];
  } else if (difficulty === 'medium') {
    const priority = (card) => {
      if (card.num === WHOT_CARD)      return 5;
      if (card.num === SUSPENSION)     return 4;
      if (card.num === PICK_TWO)       return 3;
      if (card.num === HOLD_ON)        return 2;
      if (card.num === GENERAL_MARKET) return 1;
      return 0;
    };
    playable.sort((a, b) => priority(b.c) - priority(a.c));
    chosen = playable[0];
  } else {
    const priorityHard = (card) => {
      if (card.num === WHOT_CARD)      return 10;
      if (card.num === SUSPENSION)     return 9;
      if (card.num === PICK_TWO)       return 8;
      if (card.num === HOLD_ON)        return 7;
      if (card.num === GENERAL_MARKET) return 6;
      return 0;
    };

    const shapeCounts = {};
    SHAPES.forEach(s => { shapeCounts[s] = 0; });
    cpuHand.forEach(c => { if (shapeCounts[c.shape] !== undefined) shapeCounts[c.shape]++; });

    const scoreHard = ({ c }) => {
      const p = priorityHard(c);
      if (p > 0) return p * 100;
      return shapeCounts[c.shape] || 0;
    };

    playable.sort((a, b) => scoreHard(b) - scoreHard(a));
    chosen = playable[0];
  }

  cpuHand.splice(chosen.i, 1);
  const cardName = SHAPE_LABELS[chosen.c.shape] + (chosen.c.shape === 'whot' ? '' : ' ' + chosen.c.num);
  setMessage('CPU played: ' + cardName);
  applyCard(chosen.c, 'cpu');
}

// ========== DIFFICULTY ==========
function syncDifficultyButtons() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === difficulty);
  });
  const badge = document.getElementById('diff-badge');
  if (badge) badge.textContent = DIFF_LABELS[difficulty];
}

function setDifficulty(level) {
  difficulty = level;
  syncDifficultyButtons();
}

// ========== EVENT LISTENERS ==========

document.querySelectorAll('#start-difficulty .diff-btn').forEach(btn => {
  btn.addEventListener('click', () => setDifficulty(btn.dataset.diff));
});

document.querySelectorAll('#game-difficulty .diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setDifficulty(btn.dataset.diff);
    initGame();
  });
});

document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  initGame();
});

document.getElementById('draw-btn').addEventListener('click', () => {
  if (!playerTurn || gameOver) return;
  drawCards('player', 1);
  const drawn = playerHand[playerHand.length - 1];
  if (drawn && cardCanPlay(drawn)) {
    setMessage('You drew a card. You may play it if it matches!');
    renderGame();
    return;
  }
  setMessage("You drew a card — no match. CPU's turn.");
  playerTurn = false;
  renderGame();
  setTimeout(cpuTurn, 900);
});

document.getElementById('restart-btn').addEventListener('click', initGame);

document.getElementById('rules-btn').addEventListener('click', () => {
  document.getElementById('rules-modal').style.display = 'flex';
});

document.getElementById('start-rules-btn').addEventListener('click', () => {
  document.getElementById('rules-modal').style.display = 'flex';
});

document.getElementById('close-rules').addEventListener('click', () => {
  document.getElementById('rules-modal').style.display = 'none';
});

document.getElementById('rules-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('rules-modal')) {
    document.getElementById('rules-modal').style.display = 'none';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.getElementById('rules-modal').style.display = 'none';
});
