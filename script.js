const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let userState = JSON.parse(localStorage.getItem('giftstarsin_v3_state')) || {
    balance: 0.78,
    deposits: 589.00,
    withdraws: 397.78,
    gamesPlayed: 142,
    wins: 76,
    losses: 66,
    streak: 0,
    language: 'Українська'
};

function saveState() {
    localStorage.setItem('giftstarsin_v3_state', JSON.stringify(userState));
    updateUI();
}

function updateUI() {
    document.getElementById('balance-amount').textContent = userState.balance.toFixed(2);
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
    if (isNaN(bet) || bet <= 0) { alert('Введи коректну ставку!'); return false; }
    if (bet > userState.balance) { alert('Недостатньо зірок на балансі!'); return false; }
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

function openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModals() { document.getElementById('modal-overlay').style.display = 'none'; }

function openDepositModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Поповнення балансу</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:16px;">Виберіть суму поповнення або надішліть подарунок:</p>
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
    alert(`Баланс поповнено на +${amount} ⭐️!`);
    closeModals();
}

function openWithdrawModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Виведення зірок</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:16px;">Комісія 10%.</p>
        <div class="bet-input-row" style="margin-bottom:16px;">
            <input type="number" id="withdraw-input" class="bet-input" placeholder="Сума (від 50 ⭐️)" min="50">
        </div>
        <button class="play-main-btn" onclick="processWithdraw()">Вивести</button>
    `);
}
function processWithdraw() {
    const val = parseFloat(document.getElementById('withdraw-input').value);
    if (isNaN(val) || val < 50) { alert('Мінімум 50 ⭐️'); return; }
    if (val > userState.balance) { alert('Недостатньо коштів'); return; }
    userState.balance -= val; userState.withdraws += val;
    saveState(); alert(`Заявка на виведення ${val} ⭐️ створена!`); closeModals();
}

function openLanguageModal() {
    const langs = ['Українська', 'English', 'Русский', 'Persian'];
    openModal(`
        <h3 style="margin-bottom:12px;">Виберіть мову</h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${langs.map(l => `<button class="menu-link-row" onclick="setLang('${l}')"><span>${l}</span><span>${userState.language === l ? '✓' : ''}</span></button>`).join('')}
        </div>
    `);
}
function setLang(l) { userState.language = l; saveState(); closeModals(); }
function openActivityModal() { openModal(`<h3 style="margin-bottom:12px;">Активність</h3><p style="color:#a09cc0;">Ігор: ${userState.gamesPlayed} | Перемог: ${userState.wins} | Поразок: ${userState.losses}</p>`); }
function openReferralModal() { openModal(`<h3 style="margin-bottom:12px;">Реферали</h3><p style="color:#a09cc0;">10% від поповнень друзів.</p><button class="play-main-btn" onclick="inviteFriend()">Поділитися</button>`); }
function openDailyBonusModal() { openModal(`<h3 style="margin-bottom:12px;">Щоденний бонус</h3><p style="color:#a09cc0;">Отримай безкоштовні зірки!</p><button class="play-main-btn" onclick="claimDaily()">Забрати +25 ⭐️</button>`); }
function claimDaily() { userState.balance += 25; userState.streak++; saveState(); alert('Отримано +25 ⭐️'); closeModals(); }
function openRakebackModal() { openModal(`<h3 style="margin-bottom:12px;">Рейкбек</h3><p style="color:#a09cc0;">Ваш рівень: Новачок (0.25%).</p>`); }
function inviteFriend() {
    const url = 'https://t.me/GiftStartGameBot';
    if (tg) { tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Грай у GiftStarsin!')}`); }
    else { alert('Посилання: ' + url); }
}

function openSettingsModal() {
    if (confirm('Скинути баланс та прогрес?')) { localStorage.clear(); location.reload(); }
}

// Управління іграми
function openGame(type) {
    closeModals();
    document.querySelectorAll('.tab-view').forEach(t => t.style.display = 'none');
    document.getElementById('game-screen').style.display = 'block';
    const title = document.getElementById('current-game-title');
    const container = document.getElementById('game-container');

    if (type === 'shaft') { title.textContent = '⛏️ Шахта / Кирка'; renderShaftGame(container); }
    else if (type === 'crash') { title.textContent = '🚀 Краш'; container.innerHTML = `<div class="game-panel"><p>Краш гра активна</p></div>`; }
    else if (type === 'plinko') { title.textContent = '📐 Плінко'; container.innerHTML = `<div class="game-panel"><p>Плінко гра активна</p></div>`; }
    else if (type === 'cases') { title.textContent = '📦 Кейси'; container.innerHTML = `<div class="game-panel"><p>Кейси активні</p></div>`; }
    else if (type === 'mines') { title.textContent = '💣 Міна'; container.innerHTML = `<div class="game-panel"><p>Міни активні</p></div>`; }
    else { title.textContent = '🎮 Гра'; container.innerHTML = `<div class="game-panel"><p>Гра завантажується...</p></div>`; }
}

function closeGame() {
    document.getElementById('game-screen').style.display = 'none';
}

// ІНТЕРАКТИВНА ГРА "ШАХТА / КИРКА" З АНІМАЦІЄЮ РУЙНУВАННЯ БЛОКІВ
function renderShaftGame(container) {
    container.innerHTML = `
        <div class="game-panel shaft-game-wrapper">
            <div class="shaft-wheel-box">
                <div class="shaft-wheel-inner" id="shaft-gear">⚙️</div>
            </div>
            
            <div class="shaft-grid" id="shaft-grid">
                <!-- Блоки шахти генеруються динамічно -->
            </div>

            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="shaft-bet" class="bet-input" value="1" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('shaft-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" onclick="playShaftMine()">Копати 1 ⭐️</button>
            </div>
            <div class="game-status-msg" id="shaft-msg"></div>
        </div>
    `;
    initShaftGrid();
}

const blockTypes = [
    { type: 'dirt', icon: '🟫', mult: 0 },
    { type: 'coal', icon: '⬛️', mult: 0.5 },
    { type: 'iron', icon: '⬜️', mult: 1.2 },
    { type: 'gold', icon: '🟧', mult: 2.5 },
    { type: 'diamond', icon: '💎', mult: 5.0 },
    { type: 'chest', icon: '🧰', mult: 10.0 }
];

function getRandomBlock() {
    const rand = Math.random();
    if (rand < 0.4) return blockTypes[0];
    if (rand < 0.65) return blockTypes[1];
    if (rand < 0.82) return blockTypes[2];
    if (rand < 0.93) return blockTypes[3];
    if (rand < 0.98) return blockTypes[4];
    return blockTypes[5];
}

let shaftRowsData = [];

function initShaftGrid() {
    shaftRowsData = [];
    for (let r = 0; r < 5; r++) {
        let row = [];
        for (let c = 0; c < 6; c++) {
            row.push(getRandomBlock());
        }
        shaftRowsData.push(row);
    }
    drawShaftGrid();
}

function drawShaftGrid() {
    const gridEl = document.getElementById('shaft-grid');
    if (!gridEl) return;
    gridEl.innerHTML = shaftRowsData.map((row, rIdx) => `
        <div class="shaft-row" id="row-${rIdx}">
            ${row.map(b => `<div class="shaft-block ${b.type}">${b.icon}</div>`).join('')}
        </div>
    `).join('');
}

function playShaftMine() {
    const bet = parseFloat(document.getElementById('shaft-bet').value) || 1;
    if (!validateBet(bet)) return;
    userState.balance -= bet;
    userState.gamesPlayed++;

    // Анімація обертання шестерні нагорі
    const gear = document.getElementById('shaft-gear');
    if (gear) {
        gear.style.transform = 'rotate(360deg)';
        setTimeout(() => gear.style.transform = 'rotate(0deg)', 500);
    }

    // Анімація руйнування нижнього ряду
    const bottomRowEl = document.getElementById('row-4');
    if (bottomRowEl) {
        const blocks = bottomRowEl.querySelectorAll('.shaft-block');
        blocks.forEach((block, idx) => {
            setTimeout(() => {
                block.classList.add('breaking');
            }, idx * 40);
        });
    }

    setTimeout(() => {
        // Розрахунок виграшу нижнього ряду
        let rowWin = 0;
        shaftRowsData[4].forEach(b => {
            if (b.mult > 0) rowWin += bet * b.mult;
        });

        // Зсуваємо ряди вниз (падіння)
        shaftRowsData.pop();
        let newRow = [];
        for (let c = 0; c < 6; c++) newRow.push(getRandomBlock());
        shaftRowsData.unshift(newRow);

        drawShaftGrid();

        // Додаємо новий верхній ряд з анімацією падіння
        const topRowEl = document.getElementById('row-0');
        if (topRowEl) {
            topRowEl.querySelectorAll('.shaft-block').forEach(b => b.classList.add('dropping'));
        }

        if (rowWin > 0) {
            userState.balance += rowWin;
            userState.wins++;
            document.getElementById('shaft-msg').innerHTML = `<span style="color:#2ecc71;">Видобуто скарби! Виграш: +${rowWin.toFixed(2)} ⭐️</span>`;
        } else {
            userState.losses++;
            document.getElementById('shaft-msg').innerHTML = `<span style="color:#a09cc0;">Порожня порода... Копай далі!</span>`;
        }
        saveState();
    }, 450);
}

updateUI();