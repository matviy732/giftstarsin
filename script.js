const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let userState = JSON.parse(localStorage.getItem('giftstarsin_v13_state')) || {
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
    localStorage.setItem('giftstarsin_v13_state', JSON.stringify(userState));
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
            <button class="action-btn gold-btn" onclick="addBalance(100)">+100 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(500)">+500 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(1500)">+1500 ⭐️</button>
            <button class="action-btn gold-btn" onclick="addBalance(5000)">+5000 ⭐️</button>
        </div>
        <button class="play-main-btn" onclick="closeModals()">Закрити</button>
    `);
}
function addBalance(amount) { userState.balance += amount; userState.deposits += amount; saveState(); closeModals(); }

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

    if (type === 'pickaxe') {
        title.textContent = '⛏️ Падаюча кирка';
        renderFallingPickaxe(container);
    } else if (type === 'plane') {
        title.textContent = '🚀 Краш / Літак';
        renderPlaneCrashGame(container);
    } else if (type === 'bonanza') {
        title.textContent = '🍭 Sweet Stars (Bonanza)';
        renderSweetBonanza(container);
    } else if (type === 'nft_slots') {
        title.textContent = '🎰 Gorilla NFT Slots';
        renderNftSlotsGame(container);
    } else if (type === 'mines') {
        title.textContent = '💣 Міна (Mines)';
        renderMinesGame(container);
    } else if (type === 'ladder') {
        title.textContent = '🪜 Драбинка';
        renderLadderGame(container);
    } else if (type === 'barrel') {
        title.textContent = '🛢️ Бочок';
        renderBarrelGame(container);
    }
}

function closeGame() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    document.getElementById('game-screen').style.display = 'none';
}

// ============================================================
// 1. ПАДАЮЧА КИРКА (33% шансу на "Нічого" + Піксель-арт)
// ============================================================
function renderFallingPickaxe(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Видобуто: <b id="pk-collected" style="color:#f1c40f;">0.00 ⭐️</b></span>
                <span>Ударів: <b id="pk-hits" style="color:#2ecc71;">0</b></span>
            </div>

            <div class="pickaxe-drop-banner">
                <span style="font-size:12px; color:#a09cc0;">Випала кирка:</span>
                <span class="pk-drop-badge" id="pk-current-type">🎲 Натисни кинути</span>
            </div>

            <div class="canvas-wrap">
                <canvas id="pickaxe-canvas" width="360" height="360"></canvas>
            </div>

            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="pk-bet" class="bet-input" value="5" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('pk-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="pk-drop-btn">Кинути кирку ⛏️</button>
            </div>
            <div class="game-status-msg" id="pk-msg">33% шансу на поломку (Нічого)! Або випаде Дерев'яна, Кам'яна, Золота чи Алмазна.</div>
        </div>
    `;

    const canvas = document.getElementById('pickaxe-canvas');
    const ctx = canvas.getContext('2d');
    const dropBtn = document.getElementById('pk-drop-btn');
    const collectedEl = document.getElementById('pk-collected');
    const hitsEl = document.getElementById('pk-hits');
    const msgEl = document.getElementById('pk-msg');
    const typeBadge = document.getElementById('pk-current-type');

    const COLS = 6, ROWS = 6, BLOCK_W = canvas.width / COLS, BLOCK_H = 38, START_Y = 76;
    let blocks = [], particles = [];
    let chests = [
        { mult: 0.4, label: 'x0.4', color: '#8d5524' },
        { mult: 1.3, label: 'x1.3', color: '#757575' },
        { mult: 3.5, label: 'x3.5', color: '#f1c40f' },
        { mult: 1.3, label: 'x1.3', color: '#757575' },
        { mult: 0.4, label: 'x0.4', color: '#8d5524' },
        { mult: 2.5, label: 'x2.5', color: '#00e5ff' }
    ];

    const pickaxeTiers = [
        { id: 'none', name: '💨 Нічого (Поломка)', power: 0, mult: 0, headColor: '#444', highlight: '#666', weight: 33 },
        { id: 'wood', name: '🪵 Дерев’яна (Сила 1)', power: 1, mult: 1.0, headColor: '#a1887f', highlight: '#d7ccc8', weight: 25 },
        { id: 'stone', name: '🪨 Кам’яна (Сила 2)', power: 2, mult: 1.2, headColor: '#9e9e9e', highlight: '#e0e0e0', weight: 22 },
        { id: 'gold', name: '🪙 Золота (Сила 3 • x1.5)', power: 3, mult: 1.5, headColor: '#ffd54f', highlight: '#fff59d', weight: 13 },
        { id: 'diamond', name: '💎 Алмазна (Сила 5 • x2)', power: 5, mult: 2.0, headColor: '#00e5ff', highlight: '#b2ebf2', weight: 7 }
    ];

    let activeTier = pickaxeTiers[2];
    let isDropping = false, currentBet = 5, collectedStars = 0, hitCount = 0;
    let pickaxe = { x: canvas.width / 2, y: 38, vx: 0, vy: 0, angle: 0, vAngle: 0, radius: 18 };

    function getRandomTier() {
        const totalW = pickaxeTiers.reduce((s, t) => s + t.weight, 0);
        let r = Math.random() * totalW;
        for (const t of pickaxeTiers) {
            if (r < t.weight) return t;
            r -= t.weight;
        }
        return pickaxeTiers[0];
    }

    function drawPixelPickaxe(x, y, angle, tier) {
        if (!tier || tier.id === 'none') return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const p = 3;
        const handle = [[-5, 5], [-4, 4], [-3, 3], [-2, 2], [-1, 1], [0, 0], [1, -1], [2, -2], [3, -3]];
        handle.forEach(([px, py]) => {
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(px * p - 1, py * p - 1, p + 1, p + 1);
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(px * p, py * p, p - 1, p - 1);
        });

        const head = [[-1, -5], [0, -5], [1, -5], [2, -5], [3, -4], [4, -3], [5, -2], [5, -1], [5, 0], [5, 1]];
        head.forEach(([px, py]) => {
            ctx.fillStyle = '#111';
            ctx.fillRect(px * p - 1, py * p - 1, p + 2, p + 2);
            ctx.fillStyle = tier.headColor;
            ctx.fillRect(px * p, py * p, p, p);
        });

        ctx.fillStyle = tier.highlight;
        ctx.fillRect(1 * p, -5 * p, p, p);
        ctx.fillRect(3 * p, -4 * p, p, p);
        ctx.fillRect(5 * p, -2 * p, p, p);

        ctx.restore();
    }

    function generateMineBlocks() {
        blocks = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const rand = Math.random();
                let type = r === 0 ? 'grass' : 'dirt', hp = 1, reward = 0.06;
                if (rand < 0.08) { type = 'tnt'; hp = 1; reward = 0.45; }
                else if (rand < 0.19) { type = 'diamond'; hp = 3; reward = 0.90; }
                else if (rand < 0.36) { type = 'gold'; hp = 2; reward = 0.40; }
                else if (rand < 0.68 && r > 0) { type = 'stone'; hp = 2; reward = 0.15; }
                blocks.push({ x: c * BLOCK_W, y: START_Y + r * BLOCK_H, w: BLOCK_W, h: BLOCK_H, type, hp, maxHp: hp, reward, alive: true });
            }
        }
    }

    function drawMinecraftBlock(b) {
        const x = Math.floor(b.x) + 1, y = Math.floor(b.y) + 1, w = Math.floor(b.w) - 2, h = Math.floor(b.h) - 2;

        if (b.type === 'grass' || b.type === 'dirt') {
            ctx.fillStyle = '#5d4037'; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#4e342e'; ctx.fillRect(x + 6, y + 14, 5, 4); ctx.fillRect(x + 28, y + 22, 6, 4);
            if (b.type === 'grass') {
                ctx.fillStyle = '#388e3c'; ctx.fillRect(x, y, w, 9);
                ctx.fillStyle = '#66bb6a'; ctx.fillRect(x, y, w, 3);
            }
        } else if (b.type === 'stone') {
            ctx.fillStyle = '#757575'; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#616161'; ctx.fillRect(x + 4, y + 6, 12, 5); ctx.fillRect(x + 24, y + 20, 14, 6);
        } else if (b.type === 'gold') {
            ctx.fillStyle = '#616161'; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#ffb300'; ctx.fillRect(x + 7, y + 7, 10, 7); ctx.fillRect(x + 28, y + 18, 12, 8);
            ctx.fillStyle = '#fff59d'; ctx.fillRect(x + 9, y + 8, 4, 3);
        } else if (b.type === 'diamond') {
            ctx.fillStyle = '#455a64'; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#00e5ff'; ctx.fillRect(x + 8, y + 7, 10, 8); ctx.fillRect(x + 29, y + 17, 11, 9);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 10, y + 9, 3, 3);
        } else if (b.type === 'tnt') {
            ctx.fillStyle = '#d32f2f'; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + 10, w, 16);
            ctx.fillStyle = '#000000'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
            ctx.fillText('TNT', x + w / 2, y + 22);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'; ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; ctx.fillRect(x, y + h - 3, w, 3);
    }

    function drawMinecraftChest(ch, idx, chestY) {
        const cx = idx * BLOCK_W + 3, cw = BLOCK_W - 6, chH = 34;
        ctx.fillStyle = ch.color; ctx.fillRect(cx, chestY, cw, chH);
        ctx.strokeStyle = '#222'; ctx.strokeRect(cx, chestY, cw, chH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(ch.label, cx + cw / 2, chestY + 22);
    }

    function spawnParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.7) * 5, size: 4 + Math.random() * 3, color, life: 1.0 });
        }
    }

    function drawScene() {
        ctx.fillStyle = '#0c091c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const chestY = START_Y + ROWS * BLOCK_H + 8;
        chests.forEach((ch, idx) => drawMinecraftChest(ch, idx, chestY));
        blocks.forEach(b => { if (b.alive) drawMinecraftBlock(b); });

        particles.forEach((p, idx) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.life -= 0.04;
            if (p.life <= 0) { particles.splice(idx, 1); return; }
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1;
        });

        drawPixelPickaxe(pickaxe.x, pickaxe.y, pickaxe.angle, activeTier);
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
                b.hp -= activeTier.power; hitCount++; hitsEl.textContent = hitCount;
                pickaxe.vy = -4.0 - Math.random() * 1.2; pickaxe.vx = (Math.random() - 0.5) * 5;

                if (b.hp <= 0) {
                    b.alive = false;
                    spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#ffd54f', 8);
                    collectedStars += currentBet * b.reward * activeTier.mult;
                    collectedEl.textContent = `${collectedStars.toFixed(2)} ⭐️`;
                }
                break;
            }
        }

        const chestLineY = START_Y + ROWS * BLOCK_H + 6;
        if (pickaxe.y >= chestLineY) {
            isDropping = false; dropBtn.disabled = false;
            const colIdx = Math.min(COLS - 1, Math.max(0, Math.floor(pickaxe.x / BLOCK_W)));
            const hitChest = chests[colIdx];
            const totalWin = +(collectedStars + currentBet * hitChest.mult * activeTier.mult).toFixed(2);

            userState.balance += totalWin;
            if (totalWin >= currentBet) userState.wins++; else userState.losses++;
            saveState();

            msgEl.innerHTML = `<span style="color:#2ecc71;">Скриня ${hitChest.label}! Виграно: +${totalWin.toFixed(2)} ⭐️</span>`;
            setTimeout(() => { if (!isDropping) { pickaxe.y = 38; pickaxe.vx = 0; pickaxe.vy = 0; generateMineBlocks(); } }, 1500);
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
        collectedEl.textContent = '0.00 ⭐️'; hitsEl.textContent = '0';

        activeTier = getRandomTier();
        typeBadge.textContent = activeTier.name;

        if (activeTier.id === 'none') {
            msgEl.innerHTML = `<span style="color:#e74c3c;">Кирка зламалася! Випало "Нічого". Ставка згоріла.</span>`;
            userState.losses++; saveState();
            return;
        }

        msgEl.textContent = 'Кирка летить у шахту...';
        pickaxe.y = 40; pickaxe.vy = 2; pickaxe.vx = (Math.random() - 0.5) * 4; pickaxe.vAngle = 0.25;
        generateMineBlocks(); isDropping = true; dropBtn.disabled = true;
    };

    generateMineBlocks();
    updatePhysics();
}

// ============================================================
// 2. NFT СЛОТИ (Горила / Подарунки)
// ============================================================
function renderNftSlotsGame(container) {
    const nftSymbols = ['🧸', '💧', '🎁', '💎', '👑', '⭐️', '🍬'];
    let currentBet = 69;

    container.innerHTML = `
        <div class="nft-slot-panel">
            <div class="nft-live-bar">
                <span class="nft-live-tag">LIVE</span>
                <div class="nft-live-items">🧸 🎁 💎 👑 ⭐️</div>
            </div>

            <div class="nft-reels-container">
                <div class="nft-reel" id="reel-0">
                    <div class="nft-symbol">🧸</div>
                    <div class="nft-symbol center-row" id="r0-c">💎</div>
                    <div class="nft-symbol">🎁</div>
                </div>
                <div class="nft-reel" id="reel-1">
                    <div class="nft-symbol">👑</div>
                    <div class="nft-symbol center-row" id="r1-c">⭐️</div>
                    <div class="nft-symbol">🧸</div>
                </div>
                <div class="nft-reel" id="reel-2">
                    <div class="nft-symbol">🎁</div>
                    <div class="nft-symbol center-row" id="r2-c">💎</div>
                    <div class="nft-symbol">👑</div>
                </div>
            </div>

            <div class="nft-bet-pills">
                <button class="nft-bet-pill active" onclick="setNftBet(69, this)">69 ⭐️</button>
                <button class="nft-bet-pill" onclick="setNftBet(149, this)">149 ⭐️</button>
                <button class="nft-bet-pill" onclick="setNftBet(399, this)">399 ⭐️</button>
                <button class="nft-bet-pill" onclick="setNftBet(999, this)">999 ⭐️</button>
            </div>

            <div class="nft-action-row">
                <button class="nft-sub-btn" onclick="alert('Налаштування звуку та анімації')">⚙️ Настройки</button>
                <button class="nft-sub-btn" onclick="alert('Тут знаходяться рідкісні NFT подарунки!')">🎁 Призи</button>
            </div>

            <button class="nft-spin-btn" id="nft-spin-btn" onclick="spinNftSlots()">Крутити за ⭐️ <span id="nft-btn-bet">69</span></button>
            <div class="game-status-msg" id="nft-msg" style="text-align:center; margin-top:8px;">Збери 3 однакові NFT у центральній лінії!</div>
        </div>
    `;

    window.setNftBet = (val, btn) => {
        currentBet = val;
        document.querySelectorAll('.nft-bet-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('nft-btn-bet').textContent = val;
    };

    window.spinNftSlots = async () => {
        if (!validateBet(currentBet)) return;
        userState.balance -= currentBet; userState.gamesPlayed++; saveState();

        const spinBtn = document.getElementById('nft-spin-btn');
        const msgEl = document.getElementById('nft-msg');
        spinBtn.disabled = true;
        msgEl.textContent = 'Крутимо слоти...';

        const r0 = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
        const r1 = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
        const r2 = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];

        let counter = 0;
        let interval = setInterval(() => {
            document.getElementById('r0-c').textContent = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
            document.getElementById('r1-c').textContent = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
            document.getElementById('r2-c').textContent = nftSymbols[Math.floor(Math.random() * nftSymbols.length)];
            counter++;
            if (counter > 12) {
                clearInterval(interval);
                document.getElementById('r0-c').textContent = r0;
                document.getElementById('r1-c').textContent = r1;
                document.getElementById('r2-c').textContent = r2;

                if (r0 === r1 && r1 === r2) {
                    const win = currentBet * 10;
                    userState.balance += win; userState.wins++; saveState();
                    msgEl.innerHTML = `<span style="color:#2ecc71; font-size:15px;">ДЖЕКПОТ! ТРИ ${r0}! Виграш +${win} ⭐️!</span>`;
                    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                } else if (r0 === r1 || r1 === r2 || r0 === r2) {
                    const win = currentBet * 2.5;
                    userState.balance += win; userState.wins++; saveState();
                    msgEl.innerHTML = `<span style="color:#f1c40f;">Чудово! Збіг двох символів: +${win} ⭐️</span>`;
                } else {
                    userState.losses++; saveState();
                    msgEl.innerHTML = `<span style="color:#e74c3c;">Спробуй ще раз! Немає збігу.</span>`;
                }
                spinBtn.disabled = false;
            }
        }, 90);
    };
}

// ============================================================
// 3. ІНШІ ІГРИ (Краш, Міна, Бонанза, Драбинка, Бочок)
// ============================================================
function renderPlaneCrashGame(container) {
    container.innerHTML = `
        <div class="game-panel">
            <div class="canvas-wrap"><canvas id="plane-canvas" width="360" height="220"></canvas></div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="pl-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('pl-bet').value=Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="pl-btn" style="background: linear-gradient(135deg, #00c6ff, #0072ff);">Запустити ракету 🚀</button>
            </div>
            <div class="game-status-msg" id="pl-msg">Встигни забрати виграш до падіння ракети!</div>
        </div>
    `;
    const canvas = document.getElementById('plane-canvas');
    const ctx = canvas.getContext('2d');
    const btn = document.getElementById('pl-btn');
    const msgEl = document.getElementById('pl-msg');
    let isFlying = false, crashed = false, multiplier = 1.00, targetCrash = 1.05, betAmount = 10, flightTime = 0;

    function loop() {
        ctx.fillStyle = '#090714'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (isFlying) {
            flightTime++;
            multiplier = +(1.00 + Math.pow(flightTime * 0.016, 1.35)).toFixed(2);
            btn.textContent = `Забрати ${(betAmount * multiplier).toFixed(2)} ⭐️`;
            if (multiplier >= targetCrash) {
                isFlying = false; crashed = true; multiplier = targetCrash;
                userState.losses++; saveState();
                msgEl.innerHTML = `<span style="color:#e74c3c;">Краш на ${targetCrash.toFixed(2)}x! Ставка згоріла.</span>`;
                btn.textContent = 'Запустити ракету 🚀';
            }
        }
        ctx.fillStyle = crashed ? '#e74c3c' : '#ffffff';
        ctx.font = '900 44px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${multiplier.toFixed(2)}x`, canvas.width / 2, canvas.height / 2 + 10);
        animFrameId = requestAnimationFrame(loop);
    }

    btn.onclick = () => {
        if (!isFlying) {
            const bet = parseFloat(document.getElementById('pl-bet').value);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();
            betAmount = bet; isFlying = true; crashed = false; multiplier = 1.00; flightTime = 0;
            targetCrash = +(1.1 + Math.random() * 4.0).toFixed(2);
            btn.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        } else {
            isFlying = false;
            const win = +(betAmount * multiplier).toFixed(2);
            userState.balance += win; userState.wins++; saveState();
            msgEl.innerHTML = `<span style="color:#2ecc71;">Виведено +${win.toFixed(2)} ⭐️</span>`;
            btn.textContent = 'Запустити ракету 🚀';
            btn.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
        }
    };
    loop();
}

function renderMinesGame(container) {
    container.innerHTML = 
        <div class="game-panel">
            <div class="pickaxe-hud">
                <span>Мін: <select id="m-count" style="background:#000; color:#fff; border-radius:6px;"><option value="1">1</option><option value="3" selected>3</option><option value="5">5</option></select></span>
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
    ;
    const boardEl = document.getElementById('mines-board');
    const btn = document.getElementById('m-btn');
    const multEl = document.getElementById('m-mult');
    const msgEl = document.getElementById('m-msg');
    let playing = false, bet = 5, revealed = 0, mult = 1.0;
    let grid = Array(25).fill(false), opened = Array(25).fill(false);

    function draw() {
        boardEl.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            if (opened[i]) { cell.className += grid[i] ? ' exploded' : ' revealed'; cell.textContent = grid[i] ? '💣' : '💎'; }
            cell.onclick = () => {
                if (!playing || opened[i]) return;
                if (grid[i]) {
                    opened[i] = true; playing = false; userState.losses++; saveState();
                    msgEl.innerHTML = '<span style="color:#e74c3c;">БУМ! Міна.</span>'; btn.textContent = 'Почати гру 💣';
                } else {
                    opened[i] = true; revealed++; mult = +(1.0 + revealed * 0.35).toFixed(2);
                    multEl.textContent = `${mult}x`; btn.textContent = `Забрати ${(bet * mult).toFixed(2)} ⭐️`;
                }
                draw();
            };
            boardEl.appendChild(cell);
        }
    }

    btn.onclick = () => {
        if (!playing) {
            bet = parseFloat(document.getElementById('m-bet').value);
            if (!validateBet(bet)) return;
            userState.balance -= bet; userState.gamesPlayed++; saveState();
            playing = true; revealed = 0; mult = 1.0; multEl.textContent = '1.00x'; btn.textContent = 'Забрати';
            grid.fill(false); opened.fill(false);
            let p = 0; while(p < parseInt(document.getElementById('m-count').value)) { let idx = Math.floor(Math.random()*25); if!grid[idx]=true;p++;} }
            draw();
        } else {
            playing = false; const w = +(bet * mult).toFixed(2);
            userState.balance += w; userState.wins++; saveState();
            msgEl.innerHTML = `<span style="color:#2ecc71;">Виграш: +${w} ⭐️</span>`; btn.textContent = 'Почати гру 💣';
        }
    };
    draw();
}

function renderSweetBonanza(container) {
    container.innerHTML = `<div class="game-panel"><p style="padding:40px; text-align:center;">🍬 Sweet Bonanza активна у каталозі ігор!</p></div>`;
}
function renderLadderGame(container) {
    container.innerHTML = `<div class="game-panel"><p style="padding:40px; text-align:center;">🪜 Драбинка активна у каталозі ігор!</p></div>`;
}
function renderBarrelGame(container) {
    container.innerHTML = `<div class="game-panel"><p style="padding:40px; text-align:center;">🛢️ Бочок активний у каталозі ігор!</p></div>`;
}

initTelegramProfile();
updateUI();