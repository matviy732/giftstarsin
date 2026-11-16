const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let userState = JSON.parse(localStorage.getItem('giftstarsin_v9_state')) || {
    balance: 100.00,
    deposits: 589.00,
    withdraws: 397.78,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    language: 'Українська'
};

let animFrameId = null;

function saveState() {
    localStorage.setItem('giftstarsin_v9_state', JSON.stringify(userState));
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

function initTelegramProfile() {
    const user = tg?.initDataUnsafe?.user;
    if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        document.getElementById('profile-name').textContent = fullName || 'Гравець';
        document.getElementById('profile-username').textContent = user.username ? `@${user.username}` : `ID: ${user.id}`;
        const letter = (user.first_name || 'M')[0].toUpperCase();
        const hAv = document.getElementById('header-avatar');
        const bAv = document.getElementById('profile-big-avatar');
        if (user.photo_url) {
            hAv.innerHTML = `<img src="${user.photo_url}">`;
            bAv.innerHTML = `<img src="${user.photo_url}">`;
        } else {
            hAv.textContent = letter;
            bAv.textContent = letter;
        }
    }
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
        { name: 'Матвій (Ти)', score: userState.balance, isMe: true }
    ];
    leaders.sort((a, b) => b.score - a.score);
    const listEl = document.getElementById('leaders-list');
    if (listEl) {
        listEl.innerHTML = leaders.map((p, idx) => `
            <div class="leader-row" style="${p.isMe ? 'border:1px solid #f1c40f;' : ''}">
                <span>#${idx + 1} ${p.name}</span>
                <strong style="color:#f1c40f;">${typeof p.score === 'number' ? p.score.toFixed(2) : p.score} ⭐️</strong>
            </div>
        `).join('');
    }
}

// Модалки
function openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModals() { document.getElementById('modal-overlay').style.display = 'none'; }

function openDepositModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Поповнення балансу</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
            <button class="action-btn gold-btn" onclick="addBalance(50)">+50 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(200)">+200 ⭐️</button>
        </div>
        <button class="play-main-btn" onclick="closeModals()">Закрити</button>
    `);
}
function addBalance(amount) {
    userState.balance += amount;
    userState.deposits += amount;
    saveState();
    closeModals();
}

function openWithdrawModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Виведення зірок</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:12px;">Мінімальна сума виведення — 50 ⭐️.</p>
        <input type="number" id="w-amount" class="bet-input" placeholder="50" style="width:100%; margin-bottom:12px;">
        <button class="play-main-btn" onclick="processWithdraw()">Вивести</button>
    `);
}
function processWithdraw() {
    const val = parseFloat(document.getElementById('w-amount').value);
    if (isNaN(val) || val < 50 || val > userState.balance) { alert('Некоректна сума або недостатньо зірок!'); return; }
    userState.balance -= val; userState.withdraws += val;
    saveState(); alert(`Заявку на виведення ${val.toFixed(2)} ⭐️ прийнято!`); closeModals();
}

function openActivityModal() {
    openModal(`
        <h3 style="margin-bottom:10px;">📜 Ваша активність</h3>
        <p style="color:#a09cc0; font-size:13px;">Зіграно ігор: <b>${userState.gamesPlayed}</b></p>
        <p style="color:#2ecc71; font-size:13px;">Перемог: <b>${userState.wins}</b></p>
        <p style="color:#e74c3c; font-size:13px; margin-bottom:14px;">Поразок: <b>${userState.losses}</b></p>
        <button class="play-main-btn" onclick="closeModals()">Зрозуміло</button>
    `);
}

function openLanguageModal() {
    const langs = ['Українська', 'English', 'Русский'];
    openModal(`
        <h3 style="margin-bottom:12px;">🌐 Вибір мови</h3>
        ${langs.map(l => `<button class="menu-link-row" onclick="setLang('${l}')"><span>${l}</span><span>${userState.language === l ? '✓' : ''}</span></button>`).join('')}
    `);
}
function setLang(l) { userState.language = l; saveState(); closeModals(); }

function openDailyBonusModal() { userState.balance += 25; userState.streak++; saveState(); alert('Щоденний бонус +25 ⭐️ отримано!'); }
function openReferralModal() { inviteFriend(); }
function openRakebackModal() { openModal(`<h3 style="margin-bottom:10px;">💸 Рейкбек</h3><p style="color:#a09cc0; font-size:13px; margin-bottom:14px;">Рівень: Новачок (0.25% від обороту ігор).</p><button class="play-main-btn" onclick="closeModals()">Закрити</button>`); }
function inviteFriend() {
    const url = 'https://t.me/GiftStartGameBot';
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}`);
    else alert('Посилання: ' + url);
}
function openSettingsModal() { if (confirm('Скинути прогрес і відновити 100 ⭐️?')) { localStorage.clear(); location.reload(); } }

// МАРШРУТИЗАТОР ІГОР
function openGame(type) {
    closeModals();
    document.querySelectorAll('.tab-view').forEach(t => t.style.display = 'none');
    document.getElementById('game-screen').style.display = 'block';
    const title = document.getElementById('current-game-title');
    const container = document.getElementById('game-container');

    if (type === 'plane') {
        title.textContent = '🚀 Краш / Літак';
        renderPlaneCrashGame(container);
    } else if (type === 'pickaxe') {
        title.textContent = '⛏️ Падаюча кирка';
        renderFallingPickaxe(container);
    } else if (type === 'bonanza') {
        title.textContent = '🍭 Sweet Stars (Bonanza)';
        renderSweetBonanza(container);
    } else if (type === 'mines') {
        title.textContent = '💣 Міна (Mines)';
        renderMinesGame(container);
    } else if (type === 'ladder') {
        title.textContent = '🪜 Драбинка';
        renderLadderGame(container);
    } else if (type === 'cases') {
        title.textContent = '📦 Кейси';
        renderCasesGame(container);
    } else if (type === 'barrel') {
        title.textContent = '🛢️ Бочок';
        renderBarrelGame(container);
    } else {
        title.textContent = '🎮 Мінігра';
        container.innerHTML = `<div class="game-panel"><p>Гра в розробці</p></div>`;
    }
}

function closeGame() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    document.getElementById('game-screen').style.display = 'none';
}

// ============================================================
// 1. КРАШ / ЛІТАК (Ракета з множником та крашем)
// ============================================================
function renderPlaneCrashGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="canvas-wrap">
                <canvas id="plane-canvas" width="360" height="220"></canvas>
            </div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="pl-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('pl-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="pl-btn" style="background: linear-gradient(135deg, #00c6ff, #0072ff);">Запустити ракету 🚀</button>
            </div>
            <div class="game-status-msg" id="pl-msg">Встигни забрати виграш до того, як ракета впаде!</div>
        </div>
    `;

    const canvas = document.getElementById('plane-canvas');
    const ctx = canvas.getContext('2d');
    const btn = document.getElementById('pl-btn');
    const msgEl = document.getElementById('pl-msg');

    let isFlying = false, crashed = false, multiplier = 1.00, targetCrash = 1.05, betAmount = 10, flightTime = 0;

    function drawScene() {
        const grad = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.3, 10, canvas.width * 0.5, canvas.height * 0.5, 250);
        grad.addColorStop(0, crashed ? '#3b0d14' : '#102a43');
        grad.addColorStop(1, '#090714');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        for (let y = 40; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

        if (isFlying || crashed) {
            const progress = Math.min(1, flightTime / 160);
            const endX = 40 + progress * 260;
            const endY = canvas.height - 35 - Math.pow(progress, 1.3) * 130 + Math.sin(flightTime * 0.12) * 4;

            ctx.beginPath(); ctx.moveTo(20, canvas.height - 25);
            ctx.quadraticCurveTo(endX * 0.5, canvas.height - 25, endX, endY);
            ctx.strokeStyle = crashed ? '#e74c3c' : '#00f2fe'; ctx.lineWidth = 4; ctx.stroke();

            ctx.font = '34px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(crashed ? '💥' : '🚀', endX + 8, endY - 6);
        } else {
            ctx.font = '36px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('🚀', 60, canvas.height - 35);
        }

        ctx.fillStyle = crashed ? '#e74c3c' : '#ffffff';
        ctx.font = '900 44px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${multiplier.toFixed(2)}x`, canvas.width / 2, canvas.height / 2 + 10);

        if (crashed) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(`КРАШ НА ${targetCrash.toFixed(2)}x!`, canvas.width / 2, canvas.height / 2 + 36);
        }
    }

    function loop() {
        if (isFlying) {
            flightTime++;
            multiplier = +(1.00 + Math.pow(flightTime * 0.016, 1.35)).toFixed(2);
            btn.textContent = `Забрати ${(betAmount * multiplier).toFixed(2)} ⭐️`;

            if (multiplier >= targetCrash) {
                isFlying = false; crashed = true; multiplier = targetCrash;
                userState.losses++; saveState();
                msgEl.innerHTML = `<span style="color:#e74c3c;">Ракета впала на ${targetCrash.toFixed(2)}x! Ставка згоріла.</span>`;
                btn.textContent = 'Запустити ракету 🚀';
                btn.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
            }
        }
        drawScene();
        animFrameId = requestAnimationFrame(loop);
    }

    btn.onclick = () => {
        if (!isFlying) {
            const bet = parseFloat(document.getElementById('pl-bet').value);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();

            betAmount = bet; isFlying = true; crashed = false; multiplier = 1.00; flightTime = 0;
            const r = Math.random();
            if (r < 0.40) targetCrash = +(1.05 + Math.random() * 0.4).toFixed(2);
            else if (r < 0.75) targetCrash = +(1.46 + Math.random() * 1.5).toFixed(2);
            else targetCrash = +(3.0 + Math.random() * 7.0).toFixed(2);

            msgEl.textContent = 'Ракета набирає висоту...';
            btn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        } else {
            isFlying = false;
            const win = +(betAmount * multiplier).toFixed(2);
            userState.balance += win; userState.wins++; saveState();
            msgEl.innerHTML = `<span style="color:#2ecc71;">Успіх! Виведено +${win.toFixed(2)} ⭐️ на ${multiplier.toFixed(2)}x</span>`;
            btn.textContent = 'Запустити ракету 🚀';
            btn.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
        }
    };

    loop();
}

// ============================================================
// 2. SWEET STARS (Sweet Bonanza 6x5 з каскадами)
// ============================================================
function renderSweetBonanza(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="bonanza-hud">
                <span>Виграш спіну: <b id="bz-spin-win" style="color:#f1c40f;">0.00 ⭐️</b></span>
                <span>Множник: <b id="bz-mult-total" style="color:#2ecc71;">x1</b></span>
            </div>

            <div class="bonanza-board">
                <div class="bonanza-grid" id="bz-grid"></div>
            </div>

            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="bz-bet" class="bet-input" value="2" min="0.5" step="0.5">
                    <button class="quick-bet-btn" onclick="document.getElementById('bz-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="bz-spin-btn" style="background: linear-gradient(135deg, #ff512f, #dd2476);">КРУТИТИ 🍭</button>
            </div>
            <div class="game-status-msg" id="bz-msg">Збери 8+ однакових солодощів для вибуху та каскаду!</div>
        </div>
    `;

    const ROWS = 5, COLS = 6;
    const symbols = [
        { icon: '🍌', payout: 0.25 }, { icon: '🍇', payout: 0.40 },
        { icon: '🍉', payout: 0.50 }, { icon: '🍎', payout: 0.80 },
        { icon: '🍬', payout: 1.20 }, { icon: '🍩', payout: 2.00 },
        { icon: '❤️', payout: 3.50 }, { icon: '🍭', payout: 5.00 }
    ];
    const bombMults = [2, 3, 5, 8, 10, 15, 25, 50, 100];

    let grid = [], isSpinning = false;
    const gridEl = document.getElementById('bz-grid');
    const spinBtn = document.getElementById('bz-spin-btn');
    const winEl = document.getElementById('bz-spin-win');
    const multEl = document.getElementById('bz-mult-total');
    const msgEl = document.getElementById('bz-msg');

    function createRandomCell() {
        if (Math.random() < 0.06) {
            const mult = bombMults[Math.floor(Math.random() * bombMults.length)];
            return { icon: '💣', isBomb: true, mult };
        }
        const s = symbols[Math.floor(Math.random() * symbols.length)];
        return { icon: s.icon, payout: s.payout, isBomb: false };
    }

    function initGrid() {
        grid = [];
        for (let r = 0; r < ROWS; r++) {
            let row = [];
            for (let c = 0; c < COLS; c++) { row.push(createRandomCell()); }
            grid.push(row);
        }
        drawGrid(true);
    }

    function drawGrid(withDropAnim = false) {
        let html = '';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = grid[r][c];
                if (!cell) {
                    html += `<div class="bz-cell"></div>`;
                } else if (cell.isBomb) {
                    html += `<div class="bz-cell bomb ${withDropAnim ? 'bz-drop' : ''}" id="bz-${r}-${c}"><span>💣</span><span class="bz-bomb-val">x${cell.mult}</span></div>`;
                } else {
                    html += `<div class="bz-cell ${withDropAnim ? 'bz-drop' : ''}" id="bz-${r}-${c}">${cell.icon}</div>`;
                }
            }
        }
        gridEl.innerHTML = html;
    }

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    spinBtn.onclick = async () => {
        if (isSpinning) return;
        const bet = parseFloat(document.getElementById('bz-bet').value);
        if (!validateBet(bet)) return;

        userState.balance -= bet; userState.gamesPlayed++; saveState();
        isSpinning = true; spinBtn.disabled = true;
        let cascadeWin = 0;
        winEl.textContent = '0.00 ⭐️'; multEl.textContent = 'x1'; msgEl.textContent = 'Обертання барабанів...';

        initGrid();
        await sleep(400);

        while (true) {
            const counts = {};
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = grid[r][c];
                    if (cell && !cell.isBomb) { counts[cell.icon] = (counts[cell.icon] || 0) + 1; }
                }
            }

            const winningIcons = Object.keys(counts).filter(icon => counts[icon] >= 8);
            if (winningIcons.length === 0) break;

            let stepWin = 0;
            winningIcons.forEach(icon => {
                const symObj = symbols.find(s => s.icon === icon);
                stepWin += bet * symObj.payout * (counts[icon] - 7);
            });
            cascadeWin += stepWin;
            winEl.textContent = `${cascadeWin.toFixed(2)} ⭐️`;
            msgEl.innerHTML = `<span style="color:#f1c40f;">Каскад! Зібрано ${winningIcons.join(' ')} (+${stepWin.toFixed(2)} ⭐️)</span>`;

            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = grid[r][c];
                    if (cell && winningIcons.includes(cell.icon)) {
                        const domCell = document.getElementById(`bz-${r}-${c}`);
                        if (domCell) domCell.classList.add('bz-pop');
                        grid[r][c] = null;
                    }
                }
            }
            if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            await sleep(420);

            for (let c = 0; c < COLS; c++) {
                let colItems = [];
                for (let r = ROWS - 1; r >= 0; r--) { if (grid[r][c] !== null) colItems.push(grid[r][c]); }
                while (colItems.length < ROWS) { colItems.push(createRandomCell()); }
                for (let r = ROWS - 1; r >= 0; r--) { grid[r][c] = colItems[ROWS - 1 - r]; }
            }

            drawGrid(true);
            await sleep(380);
        }

        if (cascadeWin > 0) {
            let totalBombMult = 0;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) { if (grid[r][c]?.isBomb) totalBombMult += grid[r][c].mult; }
            }
            const finalMult = totalBombMult > 0 ? totalBombMult : 1;
            multEl.textContent = `x${finalMult}`;
            const finalWin = +(cascadeWin * finalMult).toFixed(2);

            userState.balance += finalWin; userState.wins++; saveState();
            winEl.textContent = `${finalWin.toFixed(2)} ⭐️`;
            msgEl.innerHTML = `<span style="color:#2ecc71;">ВИГРАШ: +${finalWin.toFixed(2)} ⭐️ (x${finalMult})!</span>`;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            userState.losses++; saveState();
            msgEl.textContent = 'Немає 8 однакових солодощів. Спробуй ще!';
        }

        isSpinning = false; spinBtn.disabled = false;
    };

    initGrid();
}

// ============================================================
// 3. ПАДАЮЧА КИРКА (Minecraft)
// ============================================================
function renderFallingPickaxe(container) {
    let selectedTier = 'iron';
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Видобуто: <b id="pk-collected" style="color:#f1c40f;">0.00 ⭐️</b></span>
                <span>Ударів: <b id="pk-hits" style="color:#2ecc71;">0</b></span>
            </div>
            <div class="tier-selector">
                <button class="tier-btn active" id="tier-iron" onclick="selectPickaxeTier('iron')">⛏️ Залізна<br><small>x1</small></button>
                <button class="tier-btn" id="tier-gold" onclick="selectPickaxeTier('gold')">🔱 Золота<br><small>x2</small></button>
                <button class="tier-btn" id="tier-diamond" onclick="selectPickaxeTier('diamond')">💎 Алмазна<br><small>x3</small></button>
            </div>
            <div class="canvas-wrap"><canvas id="pickaxe-canvas" width="360" height="360"></canvas></div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="pk-bet" class="bet-input" value="5" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('pk-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="pk-drop-btn">Кинути кирку в шахту ⛏️</button>
            </div>
            <div class="game-status-msg" id="pk-msg">Тисни кнопку, щоб скинути кирку!</div>
        </div>
    `;

    const canvas = document.getElementById('pickaxe-canvas');
    const ctx = canvas.getContext('2d');
    const dropBtn = document.getElementById('pk-drop-btn');
    const collectedEl = document.getElementById('pk-collected');
    const hitsEl = document.getElementById('pk-hits');
    const msgEl = document.getElementById('pk-msg');

    window.selectPickaxeTier = (tier) => {
        if (isDropping) return;
        selectedTier = tier;
        document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tier-${tier}`).classList.add('active');
    };

    const COLS = 6, ROWS = 6, BLOCK_W = canvas.width / COLS, BLOCK_H = 38, START_Y = 75;
    let blocks = [], particles = [];
    let chests = [
        { mult: 0.5, label: 'x0.5' }, { mult: 1.2, label: 'x1.2' }, { mult: 3.0, label: 'x3.0' },
        { mult: 1.2, label: 'x1.2' }, { mult: 0.5, label: 'x0.5' }, { mult: 2.5, label: 'x2.5' }
    ];

    let isDropping = false, currentBet = 5, collectedStars = 0, hitCount = 0;
    let pickaxe = { x: canvas.width / 2, y: 35, vx: 0, vy: 0, angle: 0, vAngle: 0, radius: 18, power: 1 };

    function generateMineBlocks() {
        blocks = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const rand = Math.random();
                let type = r === 0 ? 'grass' : 'dirt', hp = 1, reward = 0.05;
                if (rand < 0.08) { type = 'tnt'; hp = 1; reward = 0.40; }
                else if (rand < 0.19) { type = 'diamond'; hp = 3; reward = 0.85; }
                else if (rand < 0.36) { type = 'gold'; hp = 2; reward = 0.35; }
                else if (rand < 0.68 && r > 0) { type = 'stone'; hp = 2; reward = 0.12; }
                blocks.push({ x: c * BLOCK_W, y: START_Y + r * BLOCK_H, w: BLOCK_W, h: BLOCK_H, type, hp, maxHp: hp, reward, alive: true });
            }
        }
    }

    function drawMinecraftBlock(b) {
        const x = b.x + 1, y = b.y + 1, w = b.w - 2, h = b.h - 2;
        if (b.type === 'grass' || b.type === 'dirt') {
            ctx.fillStyle = '#6d4c41'; ctx.fillRect(x, y, w, h);
            if (b.type === 'grass') { ctx.fillStyle = '#43a047'; ctx.fillRect(x, y, w, 9); }
        } else if (b.type === 'stone') { ctx.fillStyle = '#757575'; ctx.fillRect(x, y, w, h); }
        else if (b.type === 'gold') { ctx.fillStyle = '#616161'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffd54f'; ctx.fillRect(x + 8, y + 7, 10, 7); }
        else if (b.type === 'diamond') { ctx.fillStyle = '#455a64'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#00e5ff'; ctx.fillRect(x + 9, y + 8, 10, 8); }
        else if (b.type === 'tnt') { ctx.fillStyle = '#d32f2f'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('TNT', x + 12, y + 22); }
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.strokeRect(x, y, w, h);
    }

    function drawMinecraftChest(ch, idx, chestY) {
        const cx = idx * BLOCK_W + 3, cw = BLOCK_W - 6, chH = 34;
        ctx.fillStyle = '#8d5524'; ctx.fillRect(cx, chestY, cw, chH);
        ctx.strokeStyle = '#3e2723'; ctx.strokeRect(cx, chestY, cw, chH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(ch.label, cx + cw / 2, chestY + 22);
    }

    function spawnParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            particles.push({ x, y, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.8) * 6, size: 4 + Math.random() * 4, color, life: 1.0 });
        }
    }

    function drawScene() {
        ctx.fillStyle = '#0c091c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const chestY = START_Y + ROWS * BLOCK_H + 10;
        chests.forEach((ch, idx) => drawMinecraftChest(ch, idx, chestY));
        blocks.forEach(b => { if (b.alive) drawMinecraftBlock(b); });

        particles.forEach((p, idx) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.035;
            if (p.life <= 0) { particles.splice(idx, 1); return; }
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
        });

        ctx.save(); ctx.translate(pickaxe.x, pickaxe.y); ctx.rotate(pickaxe.angle);
        ctx.font = '34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⛏️', 0, 0); ctx.restore();
    }

    function updatePhysics() {
        if (!isDropping) {
            pickaxe.x = canvas.width / 2 + Math.sin(Date.now() / 350) * 110;
            pickaxe.angle = Math.sin(Date.now() / 200) * 0.25;
            drawScene();
            animFrameId = requestAnimationFrame(updatePhysics);
            return;
        }

        pickaxe.vy += 0.28; pickaxe.x += pickaxe.vx; pickaxe.y += pickaxe.vy; pickaxe.angle += pickaxe.vAngle;
        if (pickaxe.x < pickaxe.radius) { pickaxe.x = pickaxe.radius; pickaxe.vx = Math.abs(pickaxe.vx) * 0.85; }
        else if (pickaxe.x > canvas.width - pickaxe.radius) { pickaxe.x = canvas.width - pickaxe.radius; pickaxe.vx = -Math.abs(pickaxe.vx) * 0.85; }

        for (let b of blocks) {
            if (!b.alive) continue;
            if (pickaxe.x + 16 > b.x && pickaxe.x - 16 < b.x + b.w && pickaxe.y + 16 > b.y && pickaxe.y - 16 < b.y + b.h) {
                b.hp -= pickaxe.power; hitCount++; hitsEl.textContent = hitCount;
                pickaxe.vy = -4.2 - Math.random() * 1.4; pickaxe.vx = (Math.random() - 0.5) * 6;

                if (b.hp <= 0) {
                    b.alive = false;
                    spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#ffd54f', 10);
                    collectedStars += currentBet * b.reward;
                    collectedEl.textContent = `${collectedStars.toFixed(2)} ⭐️`;
                }
                break;
            }
        }

        const chestLineY = START_Y + ROWS * BLOCK_H + 8;
        if (pickaxe.y >= chestLineY) {
            isDropping = false; dropBtn.disabled = false;
            const colIdx = Math.min(COLS - 1, Math.max(0, Math.floor(pickaxe.x / BLOCK_W)));
            const hitChest = chests[colIdx];
            const totalWin = +(collectedStars + currentBet * hitChest.mult).toFixed(2);

            userState.balance += totalWin;
            if (totalWin >= currentBet) userState.wins++; else userState.losses++;
            saveState();

            msgEl.innerHTML = `<span style="color:#2ecc71;">Скриня ${hitChest.label}! Виграш: +${totalWin.toFixed(2)} ⭐️</span>`;
            setTimeout(() => { if (!isDropping) { pickaxe.y = 35; pickaxe.vx = 0; pickaxe.vy = 0; generateMineBlocks(); } }, 1400);
        }

        drawScene();
        animFrameId = requestAnimationFrame(updatePhysics);
    }

    dropBtn.onclick = () => {
        if (isDropping) return;
        const bet = parseFloat(document.getElementById('pk-bet').value);
        if (!validateBet(bet)) return;
        userState.balance -= bet; userState.gamesPlayed++; saveState();

        currentBet = bet; collectedStars = 0; hitCount = 0;
        collectedEl.textContent = '0.00 ⭐️'; hitsEl.textContent = '0'; msgEl.textContent = 'Кирка пробиває шахту...';
        pickaxe.power = selectedTier === 'diamond' ? 3 : (selectedTier === 'gold' ? 2 : 1);
        pickaxe.y = 40; pickaxe.vy = 2; pickaxe.vx = (Math.random() - 0.5) * 4; pickaxe.vAngle = 0.2;

        generateMineBlocks(); isDropping = true; dropBtn.disabled = true;
    };

    generateMineBlocks();
    updatePhysics();
}

// ============================================================
// 4. МІНА (Mines)
// ============================================================
function renderMinesGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Мін: <select id="m-count" style="background:#000; color:#fff; border-radius:6px; border:1px solid #444;"><option value="1">1</option><option value="3" selected>3</option><option value="5">5</option><option value="10">10</option></select></span>
                <span>Множник: <b id="m-mult" style="color:#f1c40f;">1.00x</b></span>
            </div>
            <div class="mines-grid" id="mines-board"></div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="m-bet" class="bet-input" value="5" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('m-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="m-btn">Почати гру 💣</button>
            </div>
            <div class="game-status-msg" id="m-msg">Відкривай безпечні клітинки і забирай виграш!</div>
        </div>
    `;

    const boardEl = document.getElementById('mines-board');
    const btn = document.getElementById('m-btn');
    const multEl = document.getElementById('m-mult');
    const msgEl = document.getElementById('m-msg');
    const countSel = document.getElementById('m-count');

    let playing = false, bet = 5, minesCount = 3, revealedCount = 0, currentMult = 1.00;
    let grid = Array(25).fill(false), opened = Array(25).fill(false);

    function renderBoard(revealAll = false) {
        boardEl.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            if (opened[i]) {
                cell.classList.add(grid[i] ? 'exploded' : 'revealed');
                cell.textContent = grid[i] ? '💣' : '💎';
            } else if (revealAll && grid[i]) { cell.textContent = '💣'; }
            cell.onclick = () => clickCell(i);
            boardEl.appendChild(cell);
        }
    }

    function clickCell(i) {
        if (!playing || opened[i]) return;
        if (grid[i]) {
            opened[i] = true; playing = false; renderBoard(true);
            userState.losses++; saveState();
            msgEl.innerHTML = `<span style="color:#e74c3c;">БУМ! Ви натрапили на міну.</span>`;
            btn.textContent = 'Почати гру 💣';
            return;
        }
        opened[i] = true; revealedCount++;
        currentMult = +(1.00 + revealedCount * (0.2 + minesCount * 0.12)).toFixed(2);
        multEl.textContent = `${currentMult}x`;
        btn.textContent = `Забрати ${(bet * currentMult).toFixed(2)} ⭐️`;
        renderBoard();
    }

    btn.onclick = () => {
        if (!playing) {
            bet = parseFloat(document.getElementById('m-bet').value);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();

            minesCount = parseInt(countSel.value);
            playing = true; revealedCount = 0; currentMult = 1.00;
            multEl.textContent = '1.00x'; msgEl.textContent = 'Гра триває...';
            btn.textContent = 'Забрати виграш';

            grid.fill(false); opened.fill(false);
            let placed = 0;
            while (placed < minesCount) {
                let idx = Math.floor(Math.random() * 25);
                if (!grid[idx]) { grid[idx] = true; placed++; }
            }
            renderBoard();
        } else {
            playing = false;
            const win = +(bet * currentMult).toFixed(2);
            userState.balance += win; userState.wins++; saveState();
            msgEl.innerHTML = `<span style="color:#2ecc71;">Виграш забрано: +${win.toFixed(2)} ⭐️!</span>`;
            btn.textContent = 'Почати гру 💣';
            renderBoard(true);
        }
    };

    renderBoard();
}

// ============================================================
// 5. ДРАБИНКА (Ladder)
// ============================================================
function renderLadderGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Рівень: <b id="l-level" style="color:#f1c40f;">1 / 8</b></span>
                <span>Множник: <b id="l-mult" style="color:#2ecc71;">1.25x</b></span>
            </div>
            <div class="ladder-container" id="ladder-board"></div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="l-bet" class="bet-input" value="5" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('l-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="l-btn">Почати підйом 🪜</button>
            </div>
            <div class="game-status-msg" id="l-msg">Обирай правильний бік сходинки!</div>
        </div>
    `;

    const boardEl = document.getElementById('ladder-board');
    const btn = document.getElementById('l-btn');
    const levelEl = document.getElementById('l-level');
    const multEl = document.getElementById('l-mult');
    const msgEl = document.getElementById('l-msg');

    const mults = [1.25, 1.60, 2.10, 2.80, 3.80, 5.20, 7.50, 12.0];
    let playing = false, bet = 5, currentStep = 0, safeSides = [];

    function renderLadder() {
        boardEl.innerHTML = '';
        for (let i = mults.length - 1; i >= 0; i--) {
            const row = document.createElement('div');
            row.className = 'ladder-row-item';
            const badge = document.createElement('div');
            badge.style.fontSize = '12px'; badge.style.fontWeight = '700'; badge.style.color = '#a09cc0';
            badge.textContent = `x${mults[i]}`;

            const leftBtn = document.createElement('div');
            leftBtn.className = `ladder-step ${playing && currentStep === i ? 'current' : ''}`;
            leftBtn.textContent = '⬅️ Лів'; leftBtn.onclick = () => chooseSide(i, 0);

            const rightBtn = document.createElement('div');
            rightBtn.className = `ladder-step ${playing && currentStep === i ? 'current' : ''}`;
            rightBtn.textContent = 'Прав ➡️'; rightBtn.onclick = () => chooseSide(i, 1);

            row.appendChild(badge); row.appendChild(leftBtn); row.appendChild(rightBtn);
            boardEl.appendChild(row);
        }
    }

    function chooseSide(rowIdx, side) {
        if (!playing || rowIdx !== currentStep) return;
        if (side === safeSides[rowIdx]) {
            currentStep++;
            if (currentStep >= mults.length) {
                playing = false;
                const win = +(bet * mults[mults.length - 1]).toFixed(2);
                userState.balance += win; userState.wins++; saveState();
                msgEl.innerHTML = `<span style="color:#2ecc71;">ПЕРЕМОГА! +${win.toFixed(2)} ⭐️!</span>`;
                btn.textContent = 'Почати підйом 🪜';
            } else {
                levelEl.textContent = `${currentStep + 1} / 8`;
                multEl.textContent = `${mults[currentStep]}x`;
                btn.textContent = `Забрати ${(bet * mults[currentStep - 1]).toFixed(2)} ⭐️`;
            }
            renderLadder();
        } else {
            playing = false; userState.losses++; saveState();
            msgEl.innerHTML = `<span style="color:#e74c3c;">Пастка! Ви впали.</span>`;
            btn.textContent = 'Почати підйом 🪜';
            renderLadder();
        }
    }

    btn.onclick = () => {
        if (!playing) {
            bet = parseFloat(document.getElementById('l-bet').value);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();

            playing = true; currentStep = 0;
            safeSides = Array.from({length: mults.length}, () => Math.random() < 0.5 ? 0 : 1);
            levelEl.textContent = '1 / 8'; multEl.textContent = `${mults[0]}x`;
            msgEl.textContent = 'Підіймайся вгору!'; btn.textContent = 'Забрати виграш';
            renderLadder();
        } else {
            playing = false;
            if (currentStep === 0) { alert('Пройди хоча б 1 крок!'); playing = true; return; }
            const win = +(bet * mults[currentStep - 1]).toFixed(2);
            userState.balance += win; userState.wins++; saveState();
            msgEl.innerHTML = `<span style="color:#2ecc71;">Виграш забрано: +${win.toFixed(2)} ⭐️</span>`;
            btn.textContent = 'Почати підйом 🪜';
            renderLadder();
        }
    };

    renderLadder();
}

// ============================================================
// 6. КЕЙСИ (Cases)
// ============================================================
function renderCasesGame(container) {
    const casesList = [
        { id: 'bronze', name: 'Бронзовий', price: 10, items: [5, 10, 15, 25] },
        { id: 'silver', name: 'Срібний', price: 40, items: [20, 45, 75, 120] },
        { id: 'gold', name: 'Золотий', price: 150, items: [80, 160, 300, 500] }
    ];
    let selectedCase = casesList[0];

    container.innerHTML = `
        <div class="game-panel">
            <div class="cases-grid-select" id="cases-selector"></div>
            <div class="case-roulette-box" id="case-box">🎁</div>
            <button class="play-main-btn" id="case-btn">Відкрити кейс</button>
            <div class="game-status-msg" id="case-msg">Обери кейс та натисни відкрити!</div>
        </div>
    `;

    const selectorEl = document.getElementById('cases-selector');
    const boxEl = document.getElementById('case-box');
    const btn = document.getElementById('case-btn');
    const msgEl = document.getElementById('case-msg');

    function renderSelector() {
        selectorEl.innerHTML = casesList.map(c => `
            <div class="case-select-card ${selectedCase.id === c.id ? 'selected' : ''}" onclick="selectCaseItem('${c.id}')">
                <div style="font-size:28px;">📦</div>
                <div style="font-size:12px; font-weight:700; margin-top:4px;">${c.name}</div>
                <div style="font-size:11px; color:#f1c40f; font-weight:800;">${c.price} ⭐️</div>
            </div>
        `).join('');
    }

    window.selectCaseItem = (id) => { selectedCase = casesList.find(c => c.id === id); renderSelector(); };

    btn.onclick = () => {
        if (!validateBet(selectedCase.price)) return;
        userState.balance -= selectedCase.price; userState.gamesPlayed++; saveState();
        btn.disabled = true; msgEl.textContent = 'Кейс відкривається...';

        let counter = 0;
        let rollInterval = setInterval(() => {
            boxEl.textContent = `${selectedCase.items[Math.floor(Math.random() * selectedCase.items.length)]} ⭐️`;
            counter++;
            if (counter > 14) {
                clearInterval(rollInterval);
                const prize = selectedCase.items[Math.floor(Math.random() * selectedCase.items.length)];
                boxEl.textContent = `${prize} ⭐️`;
                userState.balance += prize;
                if (prize >= selectedCase.price) userState.wins++; else userState.losses++;
                saveState();
                msgEl.innerHTML = `<span style="color:#2ecc71;">Виграш: +${prize} ⭐️!</span>`;
                btn.disabled = false;
            }
        }, 80);
    };

    renderSelector();
}

// ============================================================
// 7. БОЧОК (Barrel)
// ============================================================
function renderBarrelGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="barrels-grid" id="barrels-board"></div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="b-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('b-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="b-btn">Зробити ставку 🛢️</button>
            </div>
            <div class="game-status-msg" id="b-msg">Обери один з 6 бочків!</div>
        </div>
    `;

    const boardEl = document.getElementById('barrels-board');
    const btn = document.getElementById('b-btn');
    const msgEl = document.getElementById('b-msg');

    let playing = false, bet = 10, winningIdx = -1;

    function renderBarrels(opened = -1) {
        boardEl.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const b = document.createElement('div');
            b.className = 'barrel-item';
            if (opened === i) {
                b.textContent = i === winningIdx ? '💎' : '💨';
                b.style.background = i === winningIdx ? 'rgba(46,204,113,0.3)' : 'rgba(231,76,60,0.3)';
            } else { b.textContent = '🛢️'; }
            b.onclick = () => chooseBarrel(i);
            boardEl.appendChild(b);
        }
    }

    function chooseBarrel(i) {
        if (!playing) return;
        playing = false; renderBarrels(i);
        if (i === winningIdx) {
            const win = +(bet * 3.5).toFixed(2);
            userState.balance += win; userState.wins++; saveState();
            msgEl.innerHTML = `<span style="color:#2ecc71;">Виграш +${win.toFixed(2)} ⭐️</span>`;
        } else {
            userState.losses++; saveState();
            msgEl.innerHTML = `<span style="color:#e74c3c;">Пустий бочок!</span>`;
        }
        btn.textContent = 'Зробити ставку 🛢️';
    }

    btn.onclick = () => {
        bet = parseFloat(document.getElementById('b-bet').value);
        if (!validateBet(bet)) return;
        userState.balance -= bet; userState.gamesPlayed++; saveState();
        playing = true; winningIdx = Math.floor(Math.random() * 6);
        msgEl.textContent = 'Обери бочок!'; btn.textContent = 'Обирай...';
        renderBarrels();
    };

    renderBarrels();
}

initTelegramProfile();
updateUI();