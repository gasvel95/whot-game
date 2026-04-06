// ========================
// WHOT CARD GAME ENGINE
// ========================

const SHAPES = ['circle', 'triangle', 'cross', 'square', 'star'];
const SHAPE_ICONS = { circle: '⭕', triangle: '🔺', cross: '✚', square: '🟦', star: '⭐', whot: '🌈' };
const SHAPE_LABELS = { circle: 'Círculo', triangle: 'Triángulo', cross: 'Cruz', square: 'Cuadrado', star: 'Estrella', whot: 'WHOT' };

const NUMS = [1,2,3,3,4,4,5,5,5,7,7,8,8,10,10,11,11,12,12,13,13,14,14];

const WHOT_CARD      = 20;
const HOLD_ON        = 1;
const PICK_TWO       = 5;
const SUSPENSION     = 8;
const GENERAL_MARKET = 14;

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

let deck, playerHand, cpuHand, pile, topCard, playerTurn, calledShape, gameOver, waitingCallNo;

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
  do { starter = deck.pop(); } while (starter.num === WHOT_CARD || starter.num === HOLD_ON || starter.num === PICK_TWO || starter.num === GENERAL_MARKET);
  pile.push(starter);
  topCard = starter;
  playerTurn = true;

  renderGame();
  setMessage('¡Tu turno! Juega una carta.');
}

function cardCanPlay(card) {
  const effective = calledShape || topCard.shape;
  if (card.shape === 'whot') return true;
  if (card.shape === effective) return true;
  if (card.num === topCard.num && topCard.shape !== 'whot') return true;
  return false;
}

function cardHTML(card, idx, isPlayer) {
  const div = document.createElement('div');
  div.className = `card ${card.shape}`;
  if (isPlayer && cardCanPlay(card)) div.classList.add('playable');

  const shapeSpan = document.createElement('div');
  shapeSpan.className = 'shape';
  shapeSpan.textContent = SHAPE_ICONS[card.shape];

  const numSpan = document.createElement('div');
  numSpan.className = 'number';
  numSpan.textContent = card.shape === 'whot' ? 'WHOT' : card.num;

  const labelSpan = document.createElement('div');
  labelSpan.style.fontSize = '0.7rem';
  labelSpan.textContent = SHAPE_LABELS[card.shape];

  div.appendChild(shapeSpan);
  div.appendChild(numSpan);
  div.appendChild(labelSpan);

  if (isPlayer) {
    div.addEventListener('click', () => playerPlayCard(idx));
    div.title = `${SHAPE_LABELS[card.shape]} ${card.shape === 'whot' ? '' : card.num}`;
  }
  return div;
}

function renderTopCard() {
  const tc = document.getElementById('top-card');
  tc.className = `card ${topCard.shape}`;
  tc.innerHTML = '';
  const s = document.createElement('div'); s.className = 'shape'; s.textContent = SHAPE_ICONS[topCard.shape];
  const n = document.createElement('div'); n.className = 'number'; n.textContent = topCard.shape === 'whot' ? 'WHOT' : topCard.num;
  const l = document.createElement('div'); l.style.fontSize = '0.7rem'; l.textContent = calledShape ? `→ ${SHAPE_LABELS[calledShape]}` : SHAPE_LABELS[topCard.shape];
  tc.appendChild(s); tc.appendChild(n); tc.appendChild(l);
}

function renderGame() {
  document.getElementById('cpu-count').textContent = `CPU: ${cpuHand.length} cartas`;
  document.getElementById('deck-count').textContent = `Mazo: ${deck.length}`;
  document.getElementById('turn-label').textContent = playerTurn ? '🟡 Tu turno' : '🔴 Turno CPU';

  renderTopCard();

  const handDiv = document.getElementById('player-hand');
  handDiv.innerHTML = '';
  playerHand.forEach((card, idx) => handDiv.appendChild(cardHTML(card, idx, true)));

  document.getElementById('draw-btn').disabled = !playerTurn || gameOver;
  document.getElementById('restart-btn').style.display = gameOver ? 'inline-block' : 'none';
}

function setMessage(msg) {
  document.getElementById('message').textContent = msg;
}

function playerPlayCard(idx) {
  if (!playerTurn || gameOver || waitingCallNo) return;
  const card = playerHand[idx];
  if (!cardCanPlay(card)) { setMessage('⚠️ Esa carta no puede jugarse ahora.'); return; }
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
    setMessage(who === 'player' ? '🎉 ¡Ganaste! ¡Whot!' : '😢 ¡La CPU ganó! Inténtalo de nuevo.');
    gameOver = true;
    document.getElementById('restart-btn').style.display = 'inline-block';
    return;
  }

  if (card.num === WHOT_CARD) {
    if (who === 'player') {
      waitingCallNo = true;
      showCallNo();
      return;
    } else {
      calledShape = cpuPickShape();
      setMessage(`CPU juega WHOT y llama: ${SHAPE_LABELS[calledShape]}`);
    }
  } else if (card.num === HOLD_ON) {
    setMessage(who === 'player' ? '🔁 ¡Hold On! Juegas de nuevo.' : '🔁 CPU Hold On, vuelve a jugar.');
    renderGame();
    if (who === 'cpu') { setTimeout(cpuTurn, 800); return; }
    return;
  } else if (card.num === PICK_TWO) {
    drawCards(opponent, 2);
    setMessage(who === 'player' ? '✌️ CPU roba 2 cartas.' : '✌️ Robas 2 cartas.');
  } else if (card.num === GENERAL_MARKET) {
    drawCards(opponent, 1);
    setMessage(who === 'player' ? '🛒 Mercado general: CPU roba 1.' : '🛒 Mercado general: Robas 1.');
  } else if (card.num === SUSPENSION) {
    setMessage(who === 'player' ? '🚫 CPU suspendida, juegas de nuevo.' : '🚫 Suspendido, CPU juega de nuevo.');
    renderGame();
    if (who === 'cpu') { setTimeout(cpuTurn, 800); return; }
    return;
  } else {
    setMessage(who === 'player' ? 'Buen movimiento. Turno de la CPU.' : 'CPU jugó. Tu turno.');
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
  setMessage('♻️ Mazo rearmado desde la pila.');
}

function showCallNo() {
  const area = document.getElementById('call-no-area');
  const btns = document.getElementById('call-no-btns');
  btns.innerHTML = '';
  area.style.display = 'block';
  SHAPES.forEach(shape => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = `${SHAPE_ICONS[shape]} ${SHAPE_LABELS[shape]}`;
    b.style.background = '#1565c0';
    b.addEventListener('click', () => {
      calledShape = shape;
      area.style.display = 'none';
      waitingCallNo = false;
      setMessage(`Llamaste: ${SHAPE_LABELS[shape]}. Turno de la CPU.`);
      playerTurn = false;
      renderGame();
      setTimeout(cpuTurn, 900);
    });
    btns.appendChild(b);
  });
}

function cpuPickShape() {
  const counts = {};
  SHAPES.forEach(s => counts[s] = 0);
  cpuHand.forEach(c => { if (counts[c.shape] !== undefined) counts[c.shape]++; });
  return SHAPES.reduce((a, b) => counts[a] >= counts[b] ? a : b);
}

function cpuTurn() {
  if (gameOver) return;
  const playable = cpuHand.map((c, i) => ({ c, i })).filter(({ c }) => cardCanPlay(c));

  if (playable.length === 0) {
    drawCards('cpu', 1);
    setMessage('CPU no pudo jugar y robó una carta. Tu turno.');
    playerTurn = true;
    renderGame();
    return;
  }

  const priority = (card) => {
    if (card.num === WHOT_CARD)      return 5;
    if (card.num === SUSPENSION)     return 4;
    if (card.num === PICK_TWO)       return 3;
    if (card.num === HOLD_ON)        return 2;
    if (card.num === GENERAL_MARKET) return 1;
    return 0;
  };

  playable.sort((a, b) => priority(b.c) - priority(a.c));
  const chosen = playable[0];
  cpuHand.splice(chosen.i, 1);
  setMessage(`CPU jugó: ${SHAPE_LABELS[chosen.c.shape]} ${chosen.c.shape === 'whot' ? '' : chosen.c.num}`);
  applyCard(chosen.c, 'cpu');
}

document.getElementById('draw-btn').addEventListener('click', () => {
  if (!playerTurn || gameOver) return;
  drawCards('player', 1);
  setMessage('Robaste una carta. Turno de la CPU.');
  playerTurn = false;
  renderGame();
  setTimeout(cpuTurn, 900);
});

document.getElementById('restart-btn').addEventListener('click', initGame);

initGame();
