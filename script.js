const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

let userState = JSON.parse(localStorage.getItem('giftstarsin_v25_state')) || {
    balance: 100.00,
    deposits: 589.00,
    withdraws: 397.78,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    streak: 0,
    language: 'Українська',
    pickaxeLevel: 1
};

let animFrameId = null;

function saveState() {
    localStorage.setItem('giftstarsin_v25_state', JSON.stringify(userState));
    updateUI();
}

function updateUI() {
    const balEl = document.getElementById('balance-amount');
    if (balEl) balEl.textContent = userState.balance.toFixed(2);

    const depEl = document.getElementById('stat-deposits');
    if (depEl) depEl.textContent = `${userState.deposits.toFixed(0)} ⭐️`;

    const witEl = document.getElementById('stat-withdraws');
    if (witEl) witEl.textContent = `${userState.withdraws.toFixed(2)} ⭐️`;

    const strEl = document.getElementById('streak-count');
    if (strEl) strEl.textContent = userState.streak || 0;

    const langEl = document.getElementById('current-lang-label');
    if (langEl) langEl.textContent = `${userState.language} ›`;

    renderLeaders();
}

function initTelegramProfile() {
    const user = tg?.initDataUnsafe?.user;
    if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        const nameEl = document.getElementById('profile-name');
        const userEl = document.getElementById('profile-username');
        if (nameEl) nameEl.textContent = fullName || 'Гравець';
        if (userEl) userEl.textContent = user.username ? `@${user.username}` : `ID: ${user.id}`;
        
        const letter = (user.first_name || 'M')[0].toUpperCase();
        const hAv = document.getElementById('header-avatar');
        const bAv = document.getElementById('profile-big-avatar');
        if (user.photo_url) {
            if (hAv) hAv.innerHTML = `<img src="${user.photo_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            if (bAv) bAv.innerHTML = `<img src="${user.photo_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            if (hAv) hAv.textContent = letter;
            if (bAv) bAv.textContent = letter;
        }
    }
}

function switchTab(tabName) {
    closeGame();
    closeModals();
    document.querySelectorAll('.tab-view').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetNav = document.getElementById(`nav-${tabName}`);
    if (targetTab) targetTab.style.display = 'block';
    if (targetNav) targetNav.classList.add('active');
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

function openModal(html) {
    const content = document.getElementById('modal-content');
    const overlay = document.getElementById('modal-overlay');
    if (content) content.innerHTML = html;
    if (overlay) overlay.style.display = 'flex';
}

function closeModals() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

function openDepositModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Поповнення балансу</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:8px;">Введи суму зірок (мінімум 5 ⭐️):</p>
        <input type="number" id="custom-dep-amount" class="bet-input" value="50" min="5" style="width:100%; margin-bottom:10px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
            <button class="action-btn gold-btn" onclick="addBalance(5)">+5 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(100)">+100 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(500)">+500 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(1500)">+1500 ⭐️</button>
        </div>
        <button class="play-main-btn" onclick="processCustomDeposit()">Поповнити на введену суму</button>
        <button class="play-main-btn" style="background:#444; margin-top:8px;" onclick="closeModals()">Закрити</button>
    `);
}

function addBalance(amount) {
    userState.balance += amount;
    userState.deposits += amount;
    saveState();
    closeModals();
    alert(`Успішно поповнено на ${amount} ⭐️!`);
}

function processCustomDeposit() {
    const input = document.getElementById('custom-dep-amount');
    if (!input) return;
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 5) {
        alert('Мінімальна сума поповнення — 5 ⭐️!');
        return;
    }
    addBalance(val);
}

function openWithdrawModal() {
    openModal(`
        <h3 style="margin-bottom:12px;">Виведення зірок</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:6px;">Мінімальна сума виведення — 50 ⭐️.</p>
        <p style="color:#e74c3c; font-size:12px; margin-bottom:12px;">⚠️ Комісія платформи при виведенні — 15%.</p>
        <input type="number" id="w-amount" class="bet-input" placeholder="50" style="width:100%; margin-bottom:12px;" oninput="calcFee()">
        <p style="color:#f1c40f; font-size:12px; margin-bottom:12px;" id="fee-preview">Отримаєш на гаманець: 0.00 ⭐️</p>
        <button class="play-main-btn" onclick="processWithdraw()">Вивести</button>
    `);
}

function calcFee() {
    const inputEl = document.getElementById('w-amount');
    const previewEl = document.getElementById('fee-preview');
    if (!inputEl || !previewEl) return;
    const val = parseFloat(inputEl.value) || 0;
    const net = val * 0.85;
    previewEl.textContent = `Отримаєш на гаманець (після комісії 15%): ${net.toFixed(2)} ⭐️`;
}

function processWithdraw() {
    const inputEl = document.getElementById('w-amount');
    if (!inputEl) return;
    const val = parseFloat(inputEl.value);
    if (isNaN(val) || val < 50 || val > userState.balance) { 
        alert('Некоректна сума або недостатньо зірок (мінімум 50)!'); 
        return; 
    }
    const fee = val * 0.15;
    const finalAmount = val * 0.85;
    userState.balance -= val;
    userState.withdraws += val;
    saveState();
    alert(`Заявку прийнято! Списано ${val.toFixed(2)} ⭐️ (комісія 15%: ${fee.toFixed(2)} ⭐️). Надійне зарахування: ${finalAmount.toFixed(2)} ⭐️`);
    closeModals();
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

function setLang(l) {
    userState.language = l;
    saveState();
    closeModals();
}

function openDailyBonusModal() {
    userState.balance += 25;
    userState.streak++;
    saveState();
    alert('Щоденний бонус +25 ⭐️ отримано!');
}

function openReferralModal() {
    inviteFriend();
}

function openRakebackModal() {
    openModal(`
        <h3 style="margin-bottom:10px;">💸 Рейкбек</h3>
        <p style="color:#a09cc0; font-size:13px; margin-bottom:14px;">Рівень: Новачок (0.25% від оборотів ігор).</p>
        <button class="play-main-btn" onclick="closeModals()">Закрити</button>
    `);
}

function inviteFriend() {
    const url = 'https://t.me/GiftStartGameBot';
    if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}`);
    } else {
        alert('Посилання: ' + url);
    }
}

function openSettingsModal() {
    if (confirm('Скинути прогрес і відновити 100 ⭐️?')) {
        localStorage.clear();
        location.reload();
    }
}

// МАРШРУТИЗАТОР ІГОР
function openGame(type) {
    closeModals();
    document.querySelectorAll('.tab-view').forEach(t => t.style.display = 'none');
    
    const screen = document.getElementById('game-screen');
    if (screen) screen.style.display = 'block';

    const title = document.getElementById('current-game-title');
    const container = document.getElementById('game-container');
    if (!container) return;

    if (type === 'pickaxe') {
        if (title) title.textContent = '⛏️ Падаюча кирка';
        renderFallingPickaxe(container);
    } else if (type === 'plane') {
        if (title) title.textContent = '🚀 Авіамастер';
        renderPlaneCrashGame(container);
    } else if (type === 'bonanza') {
        if (title) title.textContent = '🍎 Sweet Fruit (Bonanza)';
        renderSweetBonanza(container);
    } else if (type === 'nft_slots') {
        if (title) title.textContent = '🎰 Gorilla NFT Slots';
        renderNftSlotsGame(container);
    } else if (type === 'mines') {
        if (title) title.textContent = '💣 Міна (Mines)';
        renderMinesGame(container);
    } else if (type === 'ladder') {
        if (title) title.textContent = '🪜 Драбинка';
        renderLadderGame(container);
    } else if (type === 'barrel') {
        if (title) title.textContent = '🛢️ Бочок';
        renderBarrelGame(container);
    }
}

function closeGame() {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    const screen = document.getElementById('game-screen');
    if (screen) screen.style.display = 'none';
}

// ============================================================
// 1. ПАДАЮЧА КИРКА
// ============================================================
function renderFallingPickaxe(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Видобуто: <b id="pk-collected" style="color:#f1c40f;">0.00 ⭐️</b></span>
                <span>Рівень: <b id="pk-lvl" style="color:#00e5ff;">${userState.pickaxeLevel}</b></span>
            </div>
            <div class="pickaxe-drop-banner" style="display:flex; flex-direction:column; gap:6px; align-items:center;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span style="font-size:12px; color:#a09cc0;">Рулетка вибору:</span>
                    <span class="pk-drop-badge" id="pk-current-type">🎯 Натисни кинути</span>
                </div>
                <div style="position:relative; width:100%; background:rgba(0,0,0,0.4); border-radius:10px; padding:8px; text-align:center; overflow:hidden;">
                    <div id="roulette-arrow-pointer" style="font-size:18px; transition:transform 0.4s ease;">⬇️</div>
                    <div id="roulette-items-text" style="font-size:12px; color:#f1c40f; font-weight:bold;">Нічого (45%) | Дерево | Камінь | Золото | Алмаз</div>
                </div>
            </div>
            <div class="canvas-wrap">
                <canvas id="pickaxe-canvas" width="360" height="320"></canvas>
            </div>
            <div class="bet-controls" style="margin-top:8px;">
                <div class="bet-input-row">
                    <input type="number" id="pk-bet" class="bet-input" value="5" min="1">
                    <button class="quick-bet-btn" id="pk-max-btn">MAX</button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                    <button class="play-main-btn" id="pk-drop-btn" style="background:linear-gradient(135deg, #2ecc71, #27ae60);">Кинути ⛏️</button>
                    <button class="play-main-btn" id="pk-upgrade-btn" style="background:linear-gradient(135deg, #8e2de2, #4a00e0);">Апгрейд (⚙️ <span id="upgrade-cost">50</span>)</button>
                </div>
            </div>
            <div class="game-status-msg" id="pk-msg">Шанс поломки 45%! Покращуй кирку апгрейдером.</div>
        </div>
    `;

    const canvas = document.getElementById('pickaxe-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dropBtn = document.getElementById('pk-drop-btn');
    const upgradeBtn = document.getElementById('pk-upgrade-btn');
    const maxBtn = document.getElementById('pk-max-btn');
    const collectedEl = document.getElementById('pk-collected');
    const lvlEl = document.getElementById('pk-lvl');
    const msgEl = document.getElementById('pk-msg');
    const typeBadge = document.getElementById('pk-current-type');
    const arrowPointer = document.getElementById('roulette-arrow-pointer');
    const upgradeCostSpan = document.getElementById('upgrade-cost');

    let upgradeCost = userState.pickaxeLevel * 50;
    if (upgradeCostSpan) upgradeCostSpan.textContent = upgradeCost;

    if (maxBtn) {
        maxBtn.onclick = () => {
            const betInput = document.getElementById('pk-bet');
            if (betInput) betInput.value = Math.floor(userState.balance);
        };
    }

    if (upgradeBtn) {
        upgradeBtn.onclick = () => {
            if (userState.balance < upgradeCost) { alert('Недостатньо зірок для апгрейду!'); return; }
            userState.balance -= upgradeCost;
            userState.pickaxeLevel++;
            upgradeCost = userState.pickaxeLevel * 50;
            if (upgradeCostSpan) upgradeCostSpan.textContent = upgradeCost;
            if (lvlEl) lvlEl.textContent = userState.pickaxeLevel;
            saveState();
            alert(`Апгрейд успішний! Рівень: ${userState.pickaxeLevel}`);
        };
    }

    const COLS = 6, ROWS = 6, BLOCK_W = canvas.width / COLS, BLOCK_H = 34, START_Y = 20;
    let blocks = [], particles = [];
    let chests = [
        { mult: 0.3, label: 'x0.3', color: '#8d5524' },
        { mult: 1.1, label: 'x1.1', color: '#757575' },
        { mult: 2.5, label: 'x2.5', color: '#f1c40f' },
        { mult: 1.2, label: 'x1.2', color: '#757575' },
        { mult: 0.4, label: 'x0.4', color: '#8d5524' },
        { mult: 3.0, label: 'x3.0', color: '#00e5ff' }
    ];

    const pickaxeTiers = [
        { id: 'none', name: '💨 Нічого (Поломка)', power: 0, mult: 0, headColor: '#444', highlight: '#666', weight: 45 },
        { id: 'wood', name: '🪵 Дерев’яна', power: 1, mult: 1.1, headColor: '#a1887f', highlight: '#d7ccc8', weight: 25 },
        { id: 'stone', name: '🪨 Кам’яна', power: 2, mult: 1.3, headColor: '#9e9e9e', highlight: '#e0e0e0', weight: 18 },
        { id: 'gold', name: '🪙 Золота', power: 3, mult: 1.7, headColor: '#ffd54f', highlight: '#fff59d', weight: 8 },
        { id: 'diamond', name: '💎 Алмазна', power: 5, mult: 2.4, headColor: '#00e5ff', highlight: '#b2ebf2', weight: 4 }
    ];

    let activeTier = pickaxeTiers[2];
    let isDropping = false, currentBet = 5, collectedStars = 0;
    let pickaxe = { x: canvas.width / 2, y: 15, vx: 0, vy: 0, angle: 0, vAngle: 0, radius: 16 };

    function getRandomTier() {
        let modifiedTiers = pickaxeTiers.map(t => ({...t}));
        if (userState.pickaxeLevel > 1) {
            modifiedTiers[0].weight = Math.max(25, 45 - (userState.pickaxeLevel * 3));
        }
        const totalW = modifiedTiers.reduce((s, t) => s + t.weight, 0);
        let r = Math.random() * totalW;
        for (const t of modifiedTiers) {
            if (r < t.weight) return t;
            r -= t.weight;
        }
        return modifiedTiers[0];
    }

    function drawPixelPickaxe(x, y, angle, tier) {
        if (!tier || tier.id === 'none') return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        const p = 3;
        const handle = [[-5, 5], [-4, 4], [-3, 3], [-2, 2], [-1, 1], [0, 0], [1, -1], [2, -2], [3, -3]];
        handle.forEach(([px, py]) => {
            ctx.fillStyle = '#4e342e'; ctx.fillRect(px * p - 1, py * p - 1, p + 1, p + 1);
            ctx.fillStyle = '#8d6e63'; ctx.fillRect(px * p, py * p, p - 1, p - 1);
        });
        const head = [[-1, -5], [0, -5], [1, -5], [2, -5], [3, -4], [4, -3], [5, -2], [5, -1], [5, 0], [5, 1]];
        head.forEach(([px, py]) => {
            ctx.fillStyle = '#111'; ctx.fillRect(px * p - 1, py * p - 1, p + 2, p + 2);
            ctx.fillStyle = tier.headColor; ctx.fillRect(px * p, py * p, p, p);
        });
        ctx.restore();
    }

    function generateMineBlocks() {
        blocks = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const rand = Math.random();
                let type = r === 0 ? 'grass' : 'dirt', hp = 1, reward = 0.08;
                if (rand < 0.06) { type = 'tnt'; hp = 1; reward = 0.35; }
                else if (rand < 0.15) { type = 'diamond'; hp = 3; reward = 0.70; }
                else if (rand < 0.30) { type = 'gold'; hp = 2; reward = 0.30; }
                else if (rand < 0.60 && r > 0) { type = 'stone'; hp = 2; reward = 0.15; }
                blocks.push({ x: c * BLOCK_W, y: START_Y + r * BLOCK_H, w: BLOCK_W, h: BLOCK_H, type, hp, maxHp: hp, reward, alive: true });
            }
        }
    }

    function drawMinecraftBlock(b) {
        const x = Math.floor(b.x) + 1, y = Math.floor(b.y) + 1, w = Math.floor(b.w) - 2, h = Math.floor(b.h) - 2;
        if (b.type === 'grass' || b.type === 'dirt') {
            ctx.fillStyle = '#5d4037'; ctx.fillRect(x, y, w, h);
            if (b.type === 'grass') { ctx.fillStyle = '#388e3c'; ctx.fillRect(x, y, w, 8); }
        } else if (b.type === 'stone') { ctx.fillStyle = '#757575'; ctx.fillRect(x, y, w, h); }
        else if (b.type === 'gold') { ctx.fillStyle = '#616161'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffb300'; ctx.fillRect(x + 6, y + 6, 8, 6); }
        else if (b.type === 'diamond') { ctx.fillStyle = '#455a64'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#00e5ff'; ctx.fillRect(x + 6, y + 6, 8, 6); }
        else if (b.type === 'tnt') {
            ctx.fillStyle = '#d32f2f'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + 8, w, 12);
            ctx.fillStyle = '#000000'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('TNT', x + w / 2, y + 17);
        }
    }

    function drawMinecraftChest(ch, idx, chestY) {
        const cx = idx * BLOCK_W + 3, cw = BLOCK_W - 6, chH = 28;
        ctx.fillStyle = ch.color; ctx.fillRect(cx, chestY, cw, chH);
        ctx.strokeStyle = '#222'; ctx.strokeRect(cx, chestY, cw, chH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(ch.label, cx + cw / 2, chestY + 18);
    }

    function drawScene() {
        ctx.fillStyle = '#0c091c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const chestY = START_Y + ROWS * BLOCK_H + 4;
        chests.forEach((ch, idx) => drawMinecraftChest(ch, idx, chestY));
        blocks.forEach(b => { if (b.alive) drawMinecraftBlock(b); });
        particles.forEach((p, idx) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.05;
            if (p.life <= 0) { particles.splice(idx, 1); return; }
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
        });
        drawPixelPickaxe(pickaxe.x, pickaxe.y, pickaxe.angle, activeTier);
    }

    function updatePhysics() {
        if (!isDropping) {
            pickaxe.x = canvas.width / 2 + Math.sin(Date.now() / 350) * 90;
            pickaxe.angle = Math.sin(Date.now() / 200) * 0.2;
            drawScene();
            animFrameId = requestAnimationFrame(updatePhysics);
            return;
        }
        pickaxe.vy += 0.25; pickaxe.x += pickaxe.vx; pickaxe.y += pickaxe.vy; pickaxe.angle += pickaxe.vAngle;
        if (pickaxe.x < pickaxe.radius) { pickaxe.x = pickaxe.radius; pickaxe.vx = Math.abs(pickaxe.vx) * 0.8; }
        else if (pickaxe.x > canvas.width - pickaxe.radius) { pickaxe.x = canvas.width - pickaxe.radius; pickaxe.vx = -Math.abs(pickaxe.vx) * 0.8; }

        for (let b of blocks) {
            if (!b.alive) continue;
            if (pickaxe.x + 14 > b.x && pickaxe.x - 14 < b.x + b.w && pickaxe.y + 14 > b.y && pickaxe.y - 14 < b.y + b.h) {
                b.hp -= activeTier.power;
                pickaxe.vy = -3.5 - Math.random(); pickaxe.vx = (Math.random() - 0.5) * 4;
                if (b.hp <= 0) {
                    b.alive = false;
                    collectedStars += currentBet * b.reward * activeTier.mult;
                    if (collectedEl) collectedEl.textContent = `${collectedStars.toFixed(2)} ⭐️`;
                }
                break;
            }
        }

        const chestLineY = START_Y + ROWS * BLOCK_H + 4;
        if (pickaxe.y >= chestLineY) {
            isDropping = false; if (dropBtn) dropBtn.disabled = false;
            const colIdx = Math.min(COLS - 1, Math.max(0, Math.floor(pickaxe.x / BLOCK_W)));
            const hitChest = chests[colIdx];
            const totalWin = +(collectedStars + currentBet * hitChest.mult * activeTier.mult).toFixed(2);
            userState.balance += totalWin;
            if (totalWin >= currentBet) userState.wins++; else userState.losses++;
            saveState();
            if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71;">Скриня ${hitChest.label}! Виграш: +${totalWin.toFixed(2)} ⭐️</span>`;
            setTimeout(() => { if (!isDropping) { pickaxe.y = 15; pickaxe.vx = 0; pickaxe.vy = 0; generateMineBlocks(); } }, 1500);
        }
        drawScene();
        animFrameId = requestAnimationFrame(updatePhysics);
    }

    if (dropBtn) {
        dropBtn.onclick = () => {
            if (isDropping) return;
            const betInput = document.getElementById('pk-bet');
            const bet = parseFloat(betInput ? betInput.value : 5);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();
            currentBet = bet; collectedStars = 0;
            if (collectedEl) collectedEl.textContent = '0.00 ⭐️';
            if (arrowPointer) arrowPointer.style.transform = `rotate(${Math.random() * 720 + 360}deg)`;
            activeTier = getRandomTier();
            if (typeBadge) typeBadge.textContent = activeTier.name;
            if (activeTier.id === 'none') {
                if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c;">Кирка зламалася! Випало "Нічого". Ставка згоріла.</span>`;
                userState.losses++; saveState();
                return;
            }
            if (msgEl) msgEl.textContent = 'Кирка летить у шахту...';
            pickaxe.y = 20; pickaxe.vy = 2; pickaxe.vx = (Math.random() - 0.5) * 3; pickaxe.vAngle = 0.2;
            generateMineBlocks(); isDropping = true; dropBtn.disabled = true;
        };
    }
    generateMineBlocks();
    updatePhysics();
}

// ============================================================
// 2. АВІАМАСТЕР (Літак летить, знизу платформи рухаються назустріч, навколо вода)
// ============================================================
function renderPlaneCrashGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Множник: <b id="av-mult" style="color:#f1c40f;">1.00x</b></span>
                <span>Статус: <b id="av-status" style="color:#00e5ff;">Готовий</b></span>
            </div>
            <div class="canvas-wrap">
                <canvas id="aviamester-canvas" width="360" height="210"></canvas>
            </div>
            <div class="bet-controls" style="margin-top:10px;">
                <div class="bet-input-row">
                    <input type="number" id="av-bet" class="bet-input" value="50" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('av-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                    <button class="play-main-btn" id="av-btn" style="background: linear-gradient(135deg, #ff416c, #ff4b2b);">Старт 🚀</button>
                    <button class="play-main-btn" id="av-land-btn" style="background: linear-gradient(135deg, #2ecc71, #27ae60);">Спуститися 🛬</button>
                </div>
            </div>
            <div class="game-status-msg" id="av-msg">Ракети ділять множник на 2! Злови платформу і сідай, бо впадеш у воду!</div>
        </div>
    `;
    const canvas = document.getElementById('aviamester-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const btn = document.getElementById('av-btn');
    const landBtn = document.getElementById('av-land-btn');
    const multEl = document.getElementById('av-mult');
    const statusEl = document.getElementById('av-status');
    const msgEl = document.getElementById('av-msg');

    let isPlaying = false, isLanding = false, planeX = 100, planeY = 80, currentMultiplier = 1.0, betAmount = 50;
    let missiles = [];
    let platforms = [];
    let starsBg = Array(25).fill(0).map(() => ({ x: Math.random() * 360, y: Math.random() * 210, size: Math.random() * 2 + 1, speed: Math.random() * 3 + 1 }));

    function drawScene(px, py, hitRocket) {
        let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#0a061a');
        bgGrad.addColorStop(1, '#1b143f');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        starsBg.forEach(s => {
            ctx.globalAlpha = Math.random() * 0.8 + 0.2;
            ctx.fillRect(s.x, s.y, s.size, s.size);
            if (isPlaying) {
                s.x -= s.speed;
                if (s.x < 0) s.x = canvas.width;
            }
        });
        ctx.globalAlpha = 1.0;

        missiles.forEach(m => {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(m.x, m.y, 22, 10);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(m.x + 22, m.y + 3, 8, 4);
        });

        const groundY = canvas.height - 25;
        
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(0, groundY, canvas.width, 25);

        platforms.forEach(p => {
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(p.x, groundY, p.w, 25);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🛬 ПЛАТФОРМА', p.x + p.w / 2, groundY + 16);
        });

        ctx.save();
        ctx.translate(px, py);
        
        if (isPlaying) {
            ctx.fillStyle = '#ff9800';
            ctx.beginPath();
            ctx.moveTo(-16, 0);
            ctx.lineTo(-28 - Math.random() * 6, -3);
            ctx.lineTo(-28 - Math.random() * 6, 3);
            ctx.fill();
        }

        ctx.fillStyle = hitRocket ? '#ff3333' : '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-10, -7);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = hitRocket ? '#b71c1c' : '#0097a7';
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(-8, -16);
        ctx.lineTo(-3, -16);
        ctx.lineTo(4, -2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(-8, 16);
        ctx.lineTo(-3, 16);
        ctx.lineTo(4, 2);
        ctx.fill();

        ctx.restore();
    }

    function gameLoop() {
        if (!isPlaying) return;

        if (!isLanding) {
            currentMultiplier = +(currentMultiplier + 0.025).toFixed(2);
            planeY = 70 + Math.sin(Date.now() / 250) * 30;
        } else {
            planeY += 3.5;
            
            if (planeY >= canvas.height - 35) {
                isPlaying = false;
                let landedOnPlatform = false;
                platforms.forEach(p => {
                    if (planeX >= p.x && planeX <= p.x + p.w) {
                        landedOnPlatform = true;
                    }
                });

                if (landedOnPlatform) {
                    const win = +(betAmount * currentMultiplier).toFixed(2);
                    userState.balance += win; userState.wins++; saveState();
                    if (statusEl) statusEl.textContent = 'Успіх!';
                    if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71; font-weight:bold;">Успішна посадка на платформу! Виграш: +${win} ⭐️ (${currentMultiplier}x)</span>`;
                } else {
                    userState.losses++; saveState();
                    if (statusEl) statusEl.textContent = 'Бульк!';
                    if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c; font-weight:bold;">Літак впав у воду! Ставка згоріла.</span>`;
                }
                if (btn) { btn.textContent = 'Старт 🚀'; btn.disabled = false; }
                return;
            }
        }

        if (multEl) multEl.textContent = `${currentMultiplier.toFixed(2)}x`;

        missiles.forEach(m => { m.x -= 4.5; });
        platforms.forEach(p => { p.x -= 3.0; });

        if (Math.random() < 0.03 && missiles.length < 2 && !isLanding) {
            missiles.push({ x: canvas.width + 20, y: 20 + Math.random() * 100 });
        }
        missiles = missiles.filter(m => m.x > -30);

        if (Math.random() < 0.02 && platforms.length < 2) {
            platforms.push({ x: canvas.width + 50, w: 90 });
        }
        platforms = platforms.filter(p => p.x > -100);

        for (let m of missiles) {
            if (Math.abs(m.x - planeX) < 25 && Math.abs(m.y - planeY) < 20) {
                currentMultiplier = +(currentMultiplier / 2).toFixed(2);
                if (multEl) multEl.textContent = `${currentMultiplier.toFixed(2)}x`;
                
                if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c; font-weight:bold;">💥 Влучання ракети! Множник поділено на 2: ${currentMultiplier}x</span>`;
                missiles = missiles.filter(item => item !== m);

                if (currentMultiplier <= 1.0) {
                    isPlaying = false;
                    userState.losses++;
                    saveState();
                    drawScene(planeX, planeY, true);
                    if (statusEl) statusEl.textContent = 'Збито!';
                    if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c;">Літачок розбився від ракет! Ставка згоріла.</span>`;
                    if (btn) { btn.textContent = 'Старт 🚀'; btn.disabled = false; }
                    return;
                }
            }
        }

        drawScene(planeX, planeY, false);
        animId = requestAnimationFrame(gameLoop);
    }

    if (btn) {
        btn.onclick = () => {
            if (!isPlaying) {
                const betInput = container.querySelector('#av-bet');
                betAmount = parseFloat(betInput ? betInput.value : 50);
                if (!validateBet(betAmount)) return;
                userState.balance -= betAmount; userState.gamesPlayed++; saveState();

                isPlaying = true; isLanding = false; currentMultiplier = 1.0; missiles = []; platforms = [{ x: 120, w: 90 }];
                if (statusEl) statusEl.textContent = 'У польоті ✈️';
                if (msgEl) msgEl.textContent = 'Літак летить! Ракети ділять множник на 2. Тисни "Спуститися", коли під тобою з’явиться платформа!';
                btn.textContent = 'У польоті...'; btn.disabled = true;
                gameLoop();
            }
        };
    }

    if (landBtn) {
        landBtn.onclick = () => {
            if (!isPlaying || isLanding) return;
            isLanding = true;
            if (msgEl) msgEl.textContent = 'Літак знижується... Стеж, щоб під ним була платформа, а не вода!';
        };
    }

    drawScene(planeX, planeY, false);
}

// ============================================================
// 3. NFT СЛОТИ
// ============================================================
function renderNftSlotsGame(container) {
    const nftSymbols = ['🧸', '💧', '🎁', '💎', '👑', '⭐️', '🍬'];
    let currentBet = 69;
    container.innerHTML = `
        <div class="nft-slot-panel">
            <div class="nft-live-bar"><span class="nft-live-tag">LIVE</span><div class="nft-live-items">🧸 🎁 💎 👑 ⭐️</div></div>
            <div class="nft-reels-container">
                <div class="nft-reel"><div class="nft-symbol">🧸</div><div class="nft-symbol center-row" id="r0-c">💎</div><div class="nft-symbol">🎁</div></div>
                <div class="nft-reel"><div class="nft-symbol">👑</div><div class="nft-symbol center-row" id="r1-c">⭐️</div><div class="nft-symbol">🧸</div></div>
                <div class="nft-reel"><div class="nft-symbol">🎁</div><div class="nft-symbol center-row" id="r2-c">💎</div><div class="nft-symbol">👑</div></div>
            </div>
            <div class="nft-bet-pills" id="nft-pills-container">
                <button class="nft-bet-pill active" data-bet="69">69 ⭐️</button>
                <button class="nft-bet-pill" data-bet="149">149 ⭐️</button>
                <button class="nft-bet-pill" data-bet="399">399 ⭐️</button>
                <button class="nft-bet-pill" data-bet="999">999 ⭐️</button>
            </div>
            <button class="nft-spin-btn" id="nft-spin-btn">Крутити за ⭐️ <span id="nft-btn-bet">69</span></button>
            <div class="game-status-msg" id="nft-msg" style="text-align:center; margin-top:8px;">Збери 3 однакові символи!</div>
        </div>
    `;
    const pills = container.querySelectorAll('.nft-bet-pill');
    pills.forEach(pill => {
        pill.onclick = () => {
            currentBet = parseInt(pill.getAttribute('data-bet'));
            pills.forEach(b => b.classList.remove('active')); pill.classList.add('active');
            const span = document.getElementById('nft-btn-bet'); if (span) span.textContent = currentBet;
        };
    });
    const spinBtn = container.querySelector('#nft-spin-btn');
    if (spinBtn) {
        spinBtn.onclick = () => {
            if (!validateBet(currentBet)) return;
            userState.balance -= currentBet; userState.gamesPlayed++; saveState();
            spinBtn.disabled = true; const msgEl = document.getElementById('nft-msg');
            if (msgEl) msgEl.textContent = 'Крутимо слоти...';
            const winRoll = Math.random(); let r0, r1, r2;
            if (winRoll < 0.08) { r0 = r1 = r2 = nftSymbols[Math.floor(Math.random() * nftSymbols.length)]; }
            else if (winRoll < 0.25) { r0 = r1 = nftSymbols[Math.floor(Math.random() * nftSymbols.length)]; r2 = nftSymbols.filter(s => s !== r0)[0]; }
            else { r0 = nftSymbols[0]; r1 = nftSymbols[1]; r2 = nftSymbols[2]; }
            let counter = 0;
            let interval = setInterval(() => {
                const c0 = document.getElementById('r0-c'), c1 = document.getElementById('r1-c'), c2 = document.getElementById('r2-c');
                if (c0) c0.textContent = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
                if (c1) c1.textContent = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
                if (c2) c2.textContent = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
                counter++;
                if (counter > 12) {
                    clearInterval(interval);
                    if (c0) c0.textContent = r0; if (c1) c1.textContent = r1; if (c2) c2.textContent = r2;
                    if (r0 === r1 && r1 === r2) {
                        const win = currentBet * 8; userState.balance += win; userState.wins++; saveState();
                        if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71;">ДЖЕКПОТ! Виграш +${win} ⭐️!</span>`;
                    } else if (r0 === r1 || r1 === r2 || r0 === r2) {
                        const win = currentBet * 1.8; userState.balance += win; userState.wins++; saveState();
                        if (msgEl) msgEl.innerHTML = `<span style="color:#f1c40f;">Збіг двох: +${win.toFixed(2)} ⭐️</span>`;
                    } else {
                        userState.losses++; saveState();
                        if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c;">Мимо! Ставка згоріла.</span>`;
                    }
                    spinBtn.disabled = false;
                }
            }, 90);
        };
    }
}

// ============================================================
// 4. SWEET FRUIT (BONANZA) — Падіння фруктів згори
// ============================================================
function renderSweetBonanza(container) {
    const fruits = ['🍎', '🍌', '🍇', '🍊', '🍓', '⭐️', '💣'];
    container.innerHTML = `
        <div class="game-panel">
            <h3 style="margin-bottom:6px; font-size:15px; text-align:center;">🍎 Sweet Fruit (Bonanza)</h3>
            <p style="color:#a09cc0; font-size:11px; margin-bottom:10px; text-align:center;">Фрукти падають згори! Збери 5+ однакових!</p>
            
            <div id="bonanza-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; background:rgba(0,0,0,0.4); padding:10px; border-radius:12px; margin-bottom:12px;"></div>

            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="bz-bet" class="bet-input" value="25" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('bz-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="bz-spin" style="background:linear-gradient(135deg, #ff758c, #ff7eb3); margin-top:6px;">Запустити падіння фруктів 🍎</button>
            </div>
            <div class="game-status-msg" id="bz-msg" style="margin-top:8px; text-align:center;">Очікування ставки...</div>
        </div>
    `;

    const gridEl = container.querySelector('#bonanza-grid');
    const spinBtn = container.querySelector('#bz-spin');
    const msgEl = container.querySelector('#bz-msg');

    function drawGrid(currentBoard) {
        gridEl.innerHTML = currentBoard.map(cell => `
            <div style="background:rgba(255,255,255,0.06); height:55px; display:flex; align-items:center; justify-content:center; font-size:26px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                ${cell}
            </div>
        `).join('');
    }

    let board = Array(16).fill('🍎');
    drawGrid(board);

    if (spinBtn) {
        spinBtn.onclick = () => {
            const betInput = container.querySelector('#bz-bet');
            const bet = parseFloat(betInput ? betInput.value : 25);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();
            spinBtn.disabled = true;
            msgEl.textContent = 'Фрукти падають згори у сітку...';

            let step = 0;
            let anim = setInterval(() => {
                let tempBoard = Array(16).fill(0).map(() => fruits[Math.floor(Math.random() * fruits.length)]);
                drawGrid(tempBoard);
                step++;
                if (step > 8) {
                    clearInterval(anim);
                    board = Array(16).fill(0).map(() => fruits[Math.floor(Math.random() * fruits.length)]);
                    drawGrid(board);

                    let counts = {};
                    board.forEach(s => counts[s] = (counts[s] || 0) + 1);
                    let maxMatch = Math.max(...Object.values(counts));
                    let matchedSymbol = Object.keys(counts).find(k => counts[k] === maxMatch);

                    if (maxMatch >= 5) {
                        let mult = maxMatch >= 7 ? 15.0 : (maxMatch >= 6 ? 5.0 : 2.0);
                        if (matchedSymbol === '💣') mult *= 3;
                        const win = +(bet * mult).toFixed(2);
                        userState.balance += win; userState.wins++; saveState();
                        msgEl.innerHTML = `<span style="color:#2ecc71; font-weight:bold;">Виграш! ${maxMatch} шт. (${matchedSymbol}) принесли +${win} ⭐️ (${mult}x)!</span>`;
                    } else {
                        userState.losses++; saveState();
                        msgEl.innerHTML = `<span style="color:#e74c3c;">Мало збігів. Ставка згоріла.</span>`;
                    }
                    spinBtn.disabled = false;
                }
            }, 90);
        };
    }
}

// 🛢️ Бочок
function renderBarrelGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <h3 style="margin-bottom:8px; font-size:15px;">🛢️ Вибери призову бочку</h3>
            <p style="color:#a09cc0; font-size:12px; margin-bottom:12px;">Одна з трьох бочок приховує суперприз x3, а інші порожні!</p>
            <div class="barrels-grid">
                <div class="barrel-item" onclick="pickBarrel(0)">🛢️</div>
                <div class="barrel-item" onclick="pickBarrel(1)">🛢️</div>
                <div class="barrel-item" onclick="pickBarrel(2)">🛢️</div>
            </div>
            <div class="bet-controls" style="margin-top:10px;">
                <input type="number" id="barrel-bet" class="bet-input" value="10" min="1">
            </div>
            <div class="game-status-msg" id="barrel-msg" style="margin-top:8px;">Зроби ставку та обери бочку!</div>
        </div>
    `;
    window.pickBarrel = (idx) => {
        const betInput = document.getElementById('barrel-bet');
        const bet = parseFloat(betInput ? betInput.value : 10);
        if (!validateBet(bet)) return;
        userState.balance -= bet; userState.gamesPlayed++; saveState();

        const winningIdx = Math.floor(Math.random() * 3);
        const msgEl = document.getElementById('barrel-msg');
        if (idx === winningIdx) {
            const win = bet * 3.0;
            userState.balance += win; userState.wins++; saveState();
            if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71;">Вітаю! У бочці було золото! Виграш: +${win} ⭐️</span>`;
        } else {
            userState.losses++; saveState();
            if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c;">Бочка виявилася порожньою. Ставка згоріла.</span>`;
        }
    };
}

// 🪜 Драбинка
function renderLadderGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <h3 style="margin-bottom:8px; font-size:15px;">🪜 Драбинка успіху</h3>
            <p style="color:#a09cc0; font-size:12px; margin-bottom:12px;">Підіймайся сходинками вище, але не наступи на пастку!</p>
            <div class="bet-controls" style="margin-bottom:10px;">
                <input type="number" id="ladder-bet" class="bet-input" value="10" min="1">
                <button class="play-main-btn" id="ladder-start" style="margin-top:6px;">Розпочати підйом 🪜</button>
            </div>
            <div id="ladder-area"></div>
            <div class="game-status-msg" id="ladder-msg">Обери ставку і натисни старт.</div>
        </div>
    `;
    const startBtn = container.querySelector('#ladder-start');
    const area = container.querySelector('#ladder-area');
    const msgEl = container.querySelector('#ladder-msg');
    let currentStep = 0, currentBet = 10, isClimbing = false;
    const multipliers = [1.3, 1.8, 2.5, 4.0, 7.5];

    if (startBtn) {
        startBtn.onclick = () => {
            const betInput = document.getElementById('ladder-bet');
            currentBet = parseFloat(betInput ? betInput.value : 10);
            if (!validateBet(currentBet)) return;
            userState.balance -= currentBet; userState.gamesPlayed++; saveState();
            isClimbing = true; currentStep = 0;
            startBtn.style.display = 'none';
            renderSteps();
        };
    }

    function renderSteps() {
        if (!isClimbing) return;
        area.innerHTML = `
            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:12px; text-align:center;">
                <p style="color:#f1c40f; font-weight:bold; margin-bottom:8px;">Сходинка ${currentStep + 1} з 5 (Множник: ${multipliers[currentStep]}x)</p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button class="action-btn gold-btn" onclick="climbChoice(0)">Ліворуч ⬅️</button>
                    <button class="action-btn gold-btn" onclick="climbChoice(1)">Праворуч ➡️</button>
                </div>
                <button class="action-btn green-btn" style="width:100%; margin-top:8px;" onclick="cashOutLadder()">Забрати ${(currentBet * (currentStep === 0 ? 1 : multipliers[currentStep - 1])).toFixed(2)} ⭐️</button>
            </div>
        `;
    }

    window.climbChoice = (choice) => {
        const trap = Math.random() < 0.45 ? 0 : 1;
        if (choice === trap) {
            isClimbing = false; userState.losses++; saveState();
            if (msgEl) msgEl.innerHTML = `<span style="color:#e74c3c;">Пастка на сходинці ${currentStep + 1}! Ставка згоріла.</span>`;
            area.innerHTML = ''; if (startBtn) startBtn.style.display = 'block';
        } else {
            currentStep++;
            if (currentStep >= multipliers.length) {
                const win = currentBet * multipliers[multipliers.length - 1];
                userState.balance += win; userState.wins++; saveState();
                isClimbing = false;
                if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71;">ВЕРШИНА! Виграш: +${win.toFixed(2)} ⭐️</span>`;
                area.innerHTML = ''; if (startBtn) startBtn.style.display = 'block';
            } else {
                renderSteps();
            }
        }
    };

    window.cashOutLadder = () => {
        if (currentStep === 0) { alert('Пройди хоча б одну сходинку!'); return; }
        const win = currentBet * multipliers[currentStep - 1];
        userState.balance += win; userState.wins++; saveState();
        isClimbing = false;
        if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71;">Забрано вчасно! Виграш: +${win.toFixed(2)} ⭐️</span>`;
        area.innerHTML = ''; if (startBtn) startBtn.style.display = 'block';
    };
}

// 💣 Міни
function renderMinesGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Мін: <select id="m-count" style="background:#000; color:#fff; border-radius:6px;"><option value="3" selected>3</option><option value="5">5</option><option value="8">8</option></select></span>
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
            <div class="game-status-msg" id="m-msg">Відкривай безпечні клітинки!</div>
        </div>
    `;
    const boardEl = container.querySelector('#mines-board');
    const btn = container.querySelector('#m-btn');
    const multEl = container.querySelector('#m-mult');
    const msgEl = container.querySelector('#m-msg');
    let playing = false, bet = 5, revealed = 0, mult = 1.0;
    let grid = Array(25).fill(false), opened = Array(25).fill(false);

    function draw() {
        if (!boardEl) return;
        boardEl.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            if (opened[i]) { 
                cell.className += grid[i] ? ' exploded' : ' revealed'; 
                cell.textContent = grid[i] ? '💣' : '💎'; 
            }
            cell.onclick = () => {
                if (!playing || opened[i]) return;
                if (grid[i]) {
                    opened[i] = true; playing = false; userState.losses++; saveState();
                    if (msgEl) msgEl.innerHTML = '<span style="color:#e74c3c;">БУМ! Підірвався на міні.</span>'; 
                    if (btn) btn.textContent = 'Почати гру 💣';
                } else {
                    opened[i] = true; revealed++; mult = +(1.0 + revealed * 0.25).toFixed(2);
                    if (multEl) multEl.textContent = `${mult}x`; 
                    if (btn) btn.textContent = `Забрати ${(bet * mult).toFixed(2)} ⭐️`;
                }
                draw();
            };
            boardEl.appendChild(cell);
        }
    }

    if (btn) {
        btn.onclick = () => {
            if (!playing) {
                const betInput = container.querySelector('#m-bet');
                bet = parseFloat(betInput ? betInput.value : 5);
                if (!validateBet(bet)) return;
                userState.balance -= bet; userState.gamesPlayed++; saveState();
                playing = true; revealed = 0; mult = 1.0; 
                if (multEl) multEl.textContent = '1.00x'; 
                if (btn) btn.textContent = 'Забрати';
                grid.fill(false); opened.fill(false);
                let p = 0; 
                const countSel = container.querySelector('#m-count');
                const minesTarget = countSel ? parseInt(countSel.value) : 3;
                while(p < minesTarget) { 
                    let idx = Math.floor(Math.random() * 25); 
                    if(!grid[idx]){ grid[idx] = true; p++; } 
                }
                draw();
            } else {
                playing = false; const w = +(bet * mult).toFixed(2);
                userState.balance += w; userState.wins++; saveState();
                if (msgEl) msgEl.innerHTML = `<span style="color:#2ecc71;">Виграш: +${w} ⭐️</span>`; 
                if (btn) btn.textContent = 'Почати гру 💣';
            }
        };
    }
    draw();
}

// Запуск при завантаженні
initTelegramProfile();
updateUI();