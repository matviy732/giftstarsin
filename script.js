
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// ЗАВАНТАЖЕННЯ ЗБЕРЕЖЕНИХ ДАНИХ
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem('giftstarsin_save') || '{}');
} catch (e) {
  saved = {};
}

let balance = saved.balance ?? 12560;
let totalGames = saved.totalGames ?? 0;
let totalWins = saved.totalWins ?? 0;
let clicks = saved.clicks ?? 0;
let bonusDate = saved.bonusDate ?? '';

let diceBet = 100;
let mineBet = 100;
let mines = [];
let opened = [];
let mineMultiplier = 1;
let mineActive = false;
let crashTimer = null;
let crashValue = 1;
let crashRunning = false;

// ЗБЕРЕЖЕННЯ
function saveProgress() {
  localStorage.setItem('giftstarsin_save', JSON.stringify({
    balance,
    totalGames,
    totalWins,
    clicks,
    bonusDate
  }));
}

// НАВІГАЦІЯ
function showPage(page) {
  clearInterval(crashTimer);
  crashRunning = false;

  document.querySelectorAll('.bottom-nav button')
    .forEach(b => b.classList.remove('active'));

  document.getElementById('nav-' + page)?.classList.add('active');

  const c = document.getElementById('content');

  if (page === 'home') {
    c.innerHTML = `
      <div class="balance">
        <div class="muted">ВАШ БАЛАНС</div>
        <h1>⭐ ${balance.toLocaleString('uk-UA')}</h1>
        <div class="muted">Демо-бали</div>
      </div>
      <div class="bonus-banner" onclick="showPage('bonus')">
        <h2>🎁 Бонусний кейс</h2>
        <p>Забирай щоденну нагороду!</p>
      </div>
      <h2>🎮 Популярні ігри</h2>
      ${gameCards()}
    `;
  }

  if (page === 'games') {
    c.innerHTML = `<h2>🎮 Усі ігри</h2>${gameCards()}`;
  }

  if (page === 'bonus') {
    const today = new Date().toLocaleDateString('en-CA');
    const taken = bonusDate === today;

    c.innerHTML = `
      <h2>🎁 Бонуси</h2>
      <div class="panel">
        <h2>Щоденна нагорода</h2>
        <p class="muted">Отримай 100 демо-балів.</p>
        <button class="primary" onclick="claimBonus()">
          ${taken ? 'Бонус отримано' : 'Забрати 100 ⭐'}
        </button>
      </div>
    `;
  }

  if (page === 'rating') {
    c.innerHTML = `
      <h2>🏆 Рейтинг</h2>
      <div class="ranking">🥇 Гравець 1 <b>25 000 ⭐</b></div>
      <div class="ranking">🥈 Гравець 2 <b>18 000 ⭐</b></div>
      <div class="ranking">🥉 Гравець 3 <b>12 000 ⭐</b></div>
      <div class="ranking">👤 Ти <b>${balance} ⭐</b></div>
      <p class="muted">Демонстраційний рейтинг.</p>
    `;
  }

  if (page === 'profile') {
    const user = tg?.initDataUnsafe?.user;
    const name = user?.first_name || 'Гравець';

    c.innerHTML = `
      <h2>👤 Мій профіль</h2>
      <div class="panel">
        <div style="font-size:55px;text-align:center">👤</div>
        <h2 style="text-align:center">${escapeHTML(name)}</h2>
        <p class="muted" style="text-align:center">
          ${user?.username ? '@' + escapeHTML(user.username) : 'Гравець'}
        </p>
        <div class="stat"><span>Баланс</span><b>⭐ ${balance}</b></div>
        <div class="stat"><span>Зіграно ігор</span><b>${totalGames}</b></div>
        <div class="stat"><span>Перемог</span><b>${totalWins}</b></div>
        <div class="stat"><span>Кліки</span><b>${clicks}</b></div>
      </div>
    `;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[char]);
}

function gameCards() {
  return `
    <div class="games">
      <div class="game-card" onclick="openDice()">
        <div class="game-icon">🎲</div><h3>Dice</h3>
        <p class="muted">Кубик</p>
      </div>
      <div class="game-card" onclick="openMines()">
        <div class="game-icon">💣</div><h3>Mines</h3>
        <p class="muted">Знайди зірки</p>
      </div>
      <div class="game-card" onclick="openCrash()">
        <div class="game-icon">🚀</div><h3>Crash</h3>
        <p class="muted">Множник</p>
      </div>
      <div class="game-card" onclick="openClicker()">
        <div class="game-icon">⭐</div><h3>Clicker</h3>
        <p class="muted">Збирай бали</p>
      </div>
    </div>
  `;
}

function backToGames() {
  showPage('games');
}

// БОНУСИ
function claimBonus() {
  const today = new Date().toLocaleDateString('en-CA');

  if (bonusDate === today) {
    alert('Ти вже отримав сьогоднішній бонус!');
    return;
  }

  balance += 100;
  bonusDate = today;
  saveProgress();

  alert('🎉 Ти отримав 100 демо-балів!');
  showPage('bonus');
}

// DICE
function openDice() {
  document.getElementById('content').innerHTML = `
    <button class="back" onclick="backToGames()">← Назад</button>
    <h2>🎲 Dice</h2>
    <div class="game-area">
      <div class="dice" id="dice">🎲</div>
      <div class="muted">Баланс: ⭐ <span id="diceBalance">${balance}</span></div>
      <input class="field" id="diceBet" type="number" min="1" value="100">
      <p class="muted">Вгадай: випаде 4, 5 або 6.</p>
      <button class="primary" id="diceButton" onclick="rollDice()">Кинути кубик</button>
      <div class="result" id="diceResult"></div>
    </div>
  `;
}

function rollDice() {
  const input = document.getElementById('diceBet');
  const button = document.getElementById('diceButton');
  const resultBox = document.getElementById('diceResult');
  const bet = Number(input.value);

  if (!Number.isSafeInteger(bet) || bet < 1 || bet > balance) {
    alert('Перевір суму ставки!');
    return;
  }

  button.disabled = true;
  balance -= bet;
  totalGames++;
  saveProgress();

  const result = Math.floor(Math.random() * 6) + 1;
  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];

  document.getElementById('dice').textContent = '🎲';

  setTimeout(() => {
    document.getElementById('dice').textContent = faces[result - 1];

    if (result >= 4) {
      const prize = bet * 2;
      balance += prize;
      totalWins++;
      resultBox.textContent = `🎉 Випало ${result}! Виграш: ${prize} ⭐`;
    } else {
      resultBox.textContent = `Випало ${result}. Спробуй ще раз!`;
    }

    document.getElementById('diceBalance').textContent = balance;
    saveProgress();
    button.disabled = false;
  }, 600);
}

// MINES
function openMines() {
  mineActive = false;
  mines = [];
  opened = [];
  mineMultiplier = 1;

  document.getElementById('content').innerHTML = `
    <button class="back" onclick="backToGames()">← Назад</button>
    <h2>💣 Mines</h2>
    <div class="game-area">
      <p>Знайди зірки та уникай мін!</p>
      <div class="muted">Баланс: ⭐ <span id="mineBalance">${balance}</span></div>
      <input class="field" id="mineBet" type="number" min="1" value="100">
      <select class="field" id="mineCount">
        <option value="3">3 міни</option>
        <option value="5">5 мін</option>
        <option value="7">7 мін</option>
        <option value="10">10 мін</option>
      </select>
      <div class="result" id="mineResult">Почни нову гру!</div>
      <div class="mine-grid" id="mineGrid"></div>
      <button class="primary" onclick="startMines()">Нова гра</button>
      <button class="primary" onclick="cashOut()">Забрати виграш</button>
    </div>
  `;

  renderMines();
}

function renderMines() {
  const grid = document.getElementById('mineGrid');
  if (!grid) return;

  grid.innerHTML = '';

  for (let i = 0; i < 25; i++) {
    const b = document.createElement('button');
    b.className = 'mine-cell';

    if (opened.includes(i)) {
      b.textContent = mines.includes(i) ? '💣' : '⭐';
      b.classList.add(mines.includes(i) ? 'bomb' : 'open');
    } else {
      b.textContent = '?';
    }

    b.disabled = !mineActive || opened.includes(i);
    b.onclick = () => selectMine(i);
    grid.appendChild(b);
  }
}

function startMines() {
  if (mineActive) {
    alert('Спочатку заверши поточну гру!');
    return;
  }

  const bet = Number(document.getElementById('mineBet').value);
  const count = Number(document.getElementById('mineCount').value);

  if (!Number.isSafeInteger(bet) || bet < 1 || bet > balance) {
    alert('Перевір ставку!');
    return;
  }

  balance -= bet;
  mineBet = bet;
  mines = [];

  while (mines.length < count) {
    const n = Math.floor(Math.random() * 25);
    if (!mines.includes(n)) mines.push(n);
  }

  opened = [];
  mineMultiplier = 1;
  mineActive = true;
  totalGames++;
  saveProgress();

  document.getElementById('mineBalance').textContent = balance;
  document.getElementById('mineResult').textContent = 'Шукай зірки!';
  renderMines();
}

function selectMine(i) {
  if (!mineActive || opened.includes(i)) return;

  opened.push(i);

  if (mines.includes(i)) {
    mineActive = false;
    document.getElementById('mineResult').textContent =
      '💣 Міна! Демо-ставку втрачено.';

    mines.forEach(n => {
      if (!opened.includes(n)) opened.push(n);
    });

    saveProgress();
    renderMines();
    return;
  }

  mineMultiplier += 0.25;
  document.getElementById('mineResult').textContent =
    `⭐ Зірка! Множник: x${mineMultiplier.toFixed(2)}`;

  renderMines();
}

function cashOut() {
  if (!mineActive || opened.length === 0) {
    alert('Спочатку знайди зірку!');
    return;
  }

  const prize = Math.floor(mineBet * mineMultiplier);
  balance += prize;
  totalWins++;
  mineActive = false;

  document.getElementById('mineBalance').textContent = balance;
  document.getElementById('mineResult').textContent =
    `🎉 Забрав ${prize} демо-балів!`;

  saveProgress();
  renderMines();
}

// CRASH
function openCrash() {
  clearInterval(crashTimer);
  crashRunning = false;

  document.getElementById('content').innerHTML = `
    <button class="back" onclick="backToGames()">← Назад</button>
    <h2>🚀 Crash</h2>
    <div class="game-area">
      <div class="dice" id="crashNumber">1.00x</div>
      <p class="muted">Баланс: ⭐ <span id="crashBalance">${balance}</span></p>
      <input class="field" id="crashBet" type="number" min="1" value="100">
      <button class="primary" id="crashStart" onclick="startCrash()">Старт</button>
      <button class="primary" id="crashStop" onclick="stopCrash()" disabled>Забрати виграш</button>
      <div class="result" id="crashResult"></div>
    </div>
  `;
}

function startCrash() {
  if (crashRunning) return;

  const bet = Number(document.getElementById('crashBet').value);

  if (!Number.isSafeInteger(bet) || bet < 1 || bet > balance) {
    alert('Перевір ставку!');
    return;
  }

  balance -= bet;
  totalGames++;
  saveProgress();

  crashValue = 1;
  crashRunning = true;

  const crashAt = 1.2 + Math.random() * 5;

  document.getElementById('crashBalance').textContent = balance;
  document.getElementById('crashStart').disabled = true;
  document.getElementById('crashStop').disabled = false;
  document.getElementById('crashResult').textContent = '🚀 Політ почався!';

  crashTimer = setInterval(() => {
    crashValue += 0.05;
    document.getElementById('crashNumber').textContent =
      crashValue.toFixed(2) + 'x';

    if (crashValue >= crashAt) {
      clearInterval(crashTimer);
      crashRunning = false;

      document.getElementById('crashStop').disabled = true;
      document.getElementById('crashStart').disabled = false;
      document.getElementById('crashResult').textContent =
        '💥 Краш! Демо-ставка програна.';
    }
  }, 100);
}

function stopCrash() {
  if (!crashRunning) return;

  clearInterval(crashTimer);
  crashRunning = false;

  const bet = Number(document.getElementById('crashBet').value);
  const prize = Math.floor(bet * crashValue);

  balance += prize;
  totalWins++;

  document.getElementById('crashBalance').textContent = balance;
  document.getElementById('crashStop').disabled = true;
  document.getElementById('crashStart').disabled = false;
  document.getElementById('crashResult').textContent =
    `🎉 Забрав ${prize} балів при x${crashValue.toFixed(2)}!`;

  saveProgress();
}

// CLICKER
function openClicker() {
  document.getElementById('content').innerHTML = `
    <button class="back" onclick="backToGames()">← Назад</button>
    <h2>⭐ Clicker</h2>
    <div class="game-area">
      <p>Натискай на зірку та збирай бали!</p>
      <div class="result" id="clickCount">${clicks} кліків</div>
      <button class="clicker-button" onclick="clickStar()">⭐</button>
      <p class="muted">Кожен клік = 1 демо-бал</p>
      <p>Баланс: ⭐ <span id="clickBalance">${balance}</span></p>
    </div>
  `;
}

function clickStar() {
  clicks++;
  balance++;

  document.getElementById('clickCount').textContent = `${clicks} кліків`;
  document.getElementById('clickBalance').textContent = balance;

  saveProgress();
}

// СТАРТ ЗАСТОСУНКУ
showPage('home');
