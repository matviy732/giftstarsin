// Ініціалізація Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

let userState = JSON.parse(localStorage.getItem('giftstarsin_full_state')) || {
    balance: 0.78,
    deposits: 589.00,
    withdraws: 397.78,
    gamesPlayed: 142,
    wins: 76,
    losses: 66,
    streak: 0,
    lastBonusDate: null,
    language: 'Українська'
};

let crashInterval = null;

function saveState() {
    localStorage.setItem('giftstarsin_full_state', JSON.stringify(userState));
    updateUI();
}

function updateUI() {
    const formattedBalance = userState.balance.toFixed(2);
    document.getElementById('balance-amount').textContent = formattedBalance;
    document.getElementById('stat-deposits').textContent = `${userState.deposits.toFixed(0)} ⭐️`;
    document.getElementById('stat-withdraws').textContent = `${userState.withdraws.toFixed(2)} ⭐️`;
    document.getElementById('streak-count').textContent = userState.streak || 0;
    document.getElementById('current-lang-label').textContent = `${userState.language} ›`;
    renderLeaders();
}

function switchTab(tabName) {
    closeGame();
    closeModals();
    document.querySelectorAll('.tab-view').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).style.display = 'block';
    document.getElementById(`nav-${tabName}`).classList.add('active');
}

function validateBet(bet) {
    if (isNaN(bet) || bet <= 0) {
        alert('Введи коректну ставку!');
        return false;
    }
    if (bet > userState.balance) {
        alert('Недостатньо зірок на балансі!');
        return false;
    }
    return true;
}

function renderLeaders() {
    const leaders = [
        { name: 'Amiralisa', score: 22214 },
        { name: 'Toxic', score: 21739 },
        { name: 'Тимка', score: 20935 },
        { name: 'Gojo @giftstarsin', score: 19927 },
        { name: 'Т', score: 19549 },
        { name: '~purgatory', score: 18391 },
        { name: '@giftstarsin', score: 17956 },
        { name: 'Maboychik', score: 17752 },
        { name: 'Матвій (Ти)', score: userState.balance, isMe: true }
    ];
    leaders.sort((a, b) => b.score - a.score);

    const listEl = document.getElementById('leaders-list');
    if (listEl) {
        listEl.innerHTML = leaders.map((p, idx) => `
            <div class="leader-row" style="${p.isMe ? 'border:1px solid #f1c40f;' : ''}">
                <div class="leader-left">
                    <span class="leader-rank">#${idx + 1}</span>
                    <span>${p.name}</span>
                </div>
                <strong style="color:#f1c40f;">${typeof p.score === 'number' && p.score < 1000 ? p.score.toFixed(2) : p.score} ⭐️</strong>
            </div>
        `).join('');
    }
}

// Модальні вікна (Поповнення, Виведення, Мова, Рефералка тощо)
function openModal(htmlContent) {
    document.getElementById('modal-content').innerHTML = htmlContent;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModals() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function openDepositModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Поповнення балансу</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:16px;">Надішліть подарунок на @giftstarsin_bank або виберіть метод оплати:</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
            <button class="action-btn gold-btn" onclick="addBalance(50)">+50 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(200)">+200 ⭐️</button>
        </div>
        <button class="play-main-btn" onclick="closeModals()">Готово</button>
    `);
}

function addBalance(amount) {
    userState.balance += amount;
    userState.deposits += amount;
    saveState();
    alert(`Баланс успішно поповнено на +${amount} ⭐️!`);
    closeModals();
}

function openWithdrawModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Виведення зірок</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:16px;">Комісія 10%. Залишилось відіграти оборот.</p>
        <div class="bet-input-row" style="margin-bottom:16px;">
            <input type="number" id="withdraw-input" class="bet-input" placeholder="Сума (від 50 ⭐️)" min="50">
        </div>
        <button class="play-main-btn" onclick="processWithdraw()">Вивести</button>
    `);
}

function processWithdraw() {
    const val = parseFloat(document.getElementById('withdraw-input').value);
    if (isNaN(val) || val < 50) {
        alert('Мінімальна сума виведення: 50 ⭐️');
        return;
    }
    if (val > userState.balance) {
        alert('Недостатньо зірок на балансі!');
        return;
    }
    userState.balance -= val;
    userState.withdraws += val;
    saveState();
    alert(`Заявка на виведення ${val} ⭐️ створена!`);
    closeModals();
}

function openLanguageModal() {
    const langs = ['Українська', 'English', 'Русский', 'Persian'];
    openModal(`
        <h3 style="margin-bottom:12px;">Виберіть мову</h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${langs.map(l => `
                <button class="menu-link-row" onclick="setLanguage('${l}')">
                    <span>${l}</span>
                    <span>${userState.language === l ? '✓' : ''}</span>
                </button>
            `).join('')}
        </div>
    `);
}

function setLanguage(lang) {
    userState.language = lang;
    saveState();
    closeModals();
}

function openActivityModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Ваша активність</h3>
        <p style="color:#a09cc0; font-size:13px;">Ігор зіграно: ${userState.gamesPlayed} (Перемог: ${userState.wins}, Поразок: ${userState.losses})</p>
    `);
}

function openReferralModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Реферальна програма</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:12px;">Отримуйте 10% від перших поповнень друзів!</p>
        <button class="play-main-btn" onclick="inviteFriend()">Поділитися посиланням</button>
    `);
}

function openDailyBonusModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Щоденний бонус</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:12px;">Грай щодня та забирай нагороди!</p>
        <button class="play-main-btn" onclick="claimDaily()">Забрати +25 ⭐️</button>
    `);
}

function claimDaily() {
    userState.balance += 25;
    userState.streak += 1;
    saveState();
    alert('Бонус отримано: +25 ⭐️!');
    closeModals();
}

function openRakebackModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Рейкбек</h3>
        <p style="color:#a09cc0; font-size:13px;">Ваш рівень: Новачок (0.25%). Накопичено доступних зірок для збору.</p>
    `);
}

function inviteFriend() {
    const appUrl = 'https://t.me/GiftStartGameBot';
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent('Грай у GiftStarsin та отримуй зірки!')}`);
    } else {
        alert('Посилання скопійовано: ' + appUrl);
    }
}

// Ігри: Краш, Плінко, Міни тощо
function openGame(gameType) {
    closeModals();
    document.querySelectorAll('.tab-view').forEach(tab => tab.style.display = 'none');
    const gameScreen = document.getElementById('game-screen');
    const titleEl = document.getElementById('current-game-title');
    const containerEl = document.getElementById('game-container');

    gameScreen.style.display = 'block';

    if (gameType === 'crash') {
        titleEl.textContent = '🚀 Краш / Літак';
        renderCrash(containerEl);
    } else if (gameType === 'plinko') {
        titleEl.textContent = '📐 Плінко (Plinko)';
        renderPlinko(containerEl);
    } else if (gameType === 'mines') {
        titleEl.textContent = '💣 Міни';
        renderMines(containerEl);
    } else if (gameType === 'cases') {
        titleEl.textContent = '📦 Кейси';
        renderCases(containerEl);
    } else {
        titleEl.textContent = '🎮 Мінігра';
        containerEl.innerHTML = `<div class="game-panel"><p>Ця гра завантажується...</p></div>`;
    }
}

function closeGame() {
    if (crashInterval) clearInterval(crashInterval);
    document.getElementById('game-screen').style.display = 'none';
}

// 1. КРАШ
function renderCrash(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="crash-display">
                <div style="font-size:36px;" id="crash-rocket">🚀</div>
                <div class="crash-multiplier" id="crash-mult">1.00x</div>
            </div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="crash-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('crash-bet').value = Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="crash-btn" onclick="startCrash()">Зробити ставку</button>
            </div>
            <div class="game-status-msg" id="crash-msg"></div>
        </div>
    `;
}

let isFlying = false;
let mult = 1.00;
let crashAt = 1.00;
let cBet = 10;

function startCrash() {
    const btn = document.getElementById('crash-btn');
    if (!isFlying) {
        cBet = parseFloat(document.getElementById('crash-bet').value);
        if (!validateBet(cBet)) return;
        userState.balance -= cBet;
        userState.gamesPlayed++;
        saveState();

        isFlying = true;
        mult = 1.00;
        crashAt = +(1.06 + Math.random() * 3.5).toFixed(2);
        btn.textContent = 'Забрати виграш';
        document.getElementById('crash-msg').textContent = 'Ракета летить...';

        crashInterval = setInterval(() => {
            mult += 0.04;
            document.getElementById('crash-mult').textContent = mult.toFixed(2) + 'x';
            btn.textContent = `Забрати ${(cBet * mult).toFixed(2)} ⭐️`;

            if (mult >= crashAt) {
                clearInterval(crashInterval);
                isFlying = false;
                document.getElementById('crash-rocket').textContent = '💥';
                document.getElementById('crash-mult').style.color = '#e74c3c';
                document.getElementById('crash-msg').textContent = `Краш на ${crashAt.toFixed(2)}x!`;
                userState.losses++;
                saveState();
                btn.textContent = 'Зробити ставку';
            }
        }, 90);
    } else {
        clearInterval(crashInterval);
        isFlying = false;
        const win = cBet * mult;
        userState.balance += win;
        userState.wins++;
        saveState();
        document.getElementById('crash-msg').textContent = `Виведено виграш +${win.toFixed(2)} ⭐️!`;
        document.getElementById('crash-btn').textContent = 'Зробити ставку';
    }
}

// 2. ПЛІНКО
function renderPlinko(container) {
    container.innerHTML = `
        <div class="game-panel">
            <p style="color:#a09cc0; font-size:13px; margin-bottom:10px;">Вибери ризик і кидай кульку!</p>
            <div style="font-size:48px; margin:15px 0;">⚪️ 🔻 🔴</div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="plinko-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('plinko-bet').value = Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" onclick="playPlinko()">Кинути кульку</button>
            </div>
            <div class="game-status-msg" id="plinko-msg"></div>
        </div>
    `;
}

function playPlinko() {
    const bet = parseFloat(document.getElementById('plinko-bet').value);
    if (!validateBet(bet)) return;
    userState.balance -= bet;
    userState.gamesPlayed++;

    const multipliers = [0.2, 0.5, 1.1, 2.0, 5.0, 12.0];
    const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
    const win = bet * mult;
    userState.balance += win;
    if (mult >= 1) userState.wins++; else userState.losses++;
    saveState();

    document.getElementById('plinko-msg').textContent = `Коефіцієнт x${mult}! Виграш: +${win.toFixed(2)} ⭐️`;
}

// 3. МІНИ
function renderMines(container) {
    container.innerHTML = `
        <div class="game-panel">
            <p style="color:#a09cc0; font-size:13px;">Відкривай клітинки без мін!</p>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; margin:14px 0;">
                ${Array(25).fill(0).map((_, i) => `<button class="bet-input" style="aspect-ratio:1; font-size:18px; cursor:pointer;" onclick="this.textContent='💎'; this.style.background='#2ecc71';">?</button>`).join('')}
            </div>
        </div>
    `;
}

// 4. КЕЙСИ
function renderCases(container) {
    container.innerHTML = `
        <div class="game-panel">
            <h3 style="margin-bottom:8px;">📦 Виберіть кейс</h3>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                <button class="action-btn gold-btn" onclick="openCaseReward('Супер економ', 1)">Супер економ (1 ⭐️)</button>
                <button class="action-btn purple-btn" onclick="openCaseReward('Економ', 2)">Економ (2 ⭐️)</button>
                <button class="action-btn green-btn" onclick="openCaseReward('Все або нічого', 10)">Все або нічого (10 ⭐️)</button>
            </div>
            <div class="game-status-msg" id="case-msg" style="margin-top:14px;"></div>
        </div>
    `;
}

function openCaseReward(name, price) {
    if (!validateBet(price)) return;
    userState.balance -= price;
    userState.gamesPlayed++;

    const reward = +(Math.random() * price * 3).toFixed(2);
    userState.balance += reward;
    if (reward >= price) userState.wins++; else userState.losses++;
    saveState();

    document.getElementById('case-msg').textContent = `Відкрито "${name}"! Ви виграли +${reward} ⭐️`;
}

// Початковий запуск
updateUI();