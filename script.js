// Ініціалізація Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Стан користувача
let userState = JSON.parse(localStorage.getItem('giftstarsin_state')) || {
    balance: 100.00,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    lastBonusDate: null,
    streak: 0,
    mineLevel: 1,
    mineProgress: 0
};

let crashInterval = null;

function saveState() {
    localStorage.setItem('giftstarsin_state', JSON.stringify(userState));
    updateUI();
}

function updateUI() {
    const formattedBalance = userState.balance.toFixed(2);
    document.getElementById('balance-amount').textContent = formattedBalance;
    document.getElementById('stat-balance').textContent = `${formattedBalance} ⭐️`;
    document.getElementById('stat-games').textContent = userState.gamesPlayed;
    document.getElementById('stat-wins').textContent = userState.wins;
    document.getElementById('stat-losses').textContent = userState.losses;
    document.getElementById('streak-count').textContent = userState.streak || 0;
    renderLeaders();
}

function initTelegramProfile() {
    const user = tg?.initDataUnsafe?.user;
    if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        document.getElementById('profile-name').textContent = fullName || 'Гравець';
        document.getElementById('profile-username').textContent = user.username ? `@${user.username}` : `ID: ${user.id}`;

        const firstLetter = (user.first_name || 'M')[0].toUpperCase();
        const headerAvatar = document.getElementById('header-avatar');
        const bigAvatar = document.getElementById('profile-big-avatar');

        if (user.photo_url) {
            headerAvatar.innerHTML = `<img src="${user.photo_url}" alt="avatar">`;
            bigAvatar.innerHTML = `<img src="${user.photo_url}" alt="avatar">`;
        } else {
            headerAvatar.textContent = firstLetter;
            bigAvatar.textContent = firstLetter;
        }
    }
}

function switchTab(tabName) {
    closeGame();
    document.querySelectorAll('.tab-view').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).style.display = 'block';
    document.getElementById(`nav-${tabName}`).classList.add('active');
}

function claimDailyBonus() {
    const today = new Date().toDateString();
    if (userState.lastBonusDate === today) {
        alert('Ти вже забрав сьогоднішній бонус! Повертайся завтра.');
        return;
    }
    userState.balance += 50;
    userState.streak = (userState.streak || 0) + 1;
    userState.lastBonusDate = today;
    saveState();
    alert('Вітаємо! Отримано +50.00 ⭐️');
}

function addDemoBalance() {
    if (userState.balance < 10) {
        userState.balance += 100;
        saveState();
        alert('Демо-баланс поповнено на +100.00 ⭐️!');
    } else {
        switchTab('contests');
    }
}

function inviteFriend() {
    const shareText = 'Грай у мініігри та збирай зірочки в GiftStarsin! ⭐️';
    const appUrl = 'https://t.me/GiftStartGameBot';
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`);
    } else {
        alert('Посилання для запрошення: ' + appUrl);
    }
}

function renderLeaders() {
    const currentUserName = document.getElementById('profile-name').textContent;
    const leaders = [
        { name: 'CryptoKing', score: 1540.50, isMe: false },
        { name: 'StarHunter', score: 980.00, isMe: false },
        { name: currentUserName + ' (Ти)', score: userState.balance, isMe: true },
        { name: 'LuckyFox', score: 420.25, isMe: false },
        { name: 'Alex_UA', score: 215.00, isMe: false }
    ];

    leaders.sort((a, b) => b.score - a.score);

    const listEl = document.getElementById('leaders-list');
    listEl.innerHTML = leaders.map((player, idx) => `
        <div class="leader-row ${player.isMe ? 'is-me' : ''}">
            <div class="leader-left">
                <span class="leader-rank">#${idx + 1}</span>
                <span>${player.name}</span>
            </div>
            <strong class="gold-text">${player.score.toFixed(2)} ⭐️</strong>
        </div>
    `).join('');
}

function openSettings() {
    if (confirm('Скинути весь прогрес і відновити початковий баланс 100 ⭐️?')) {
        localStorage.removeItem('giftstarsin_state');
        location.reload();
    }
}

function closeGame() {
    if (crashInterval) {
        clearInterval(crashInterval);
        crashInterval = null;
    }
    document.getElementById('game-screen').style.display = 'none';
}

function validateBet(bet) {
    if (isNaN(bet) || bet <= 0) {
        alert('Введи коректну суму ставки!');
        return false;
    }
    if (bet > userState.balance) {
        alert('Недостатньо зірок на балансі!');
        return false;
    }
    return true;
}

// ==========================================
// МІНІІГРИ: ШАХТА (КИРКА), КЕЙСИ, DICE, MINES, CRASH
// ==========================================

function openGame(gameType) {
    document.querySelectorAll('.tab-view').forEach(tab => tab.style.display = 'none');
    const gameScreen = document.getElementById('game-screen');
    const titleEl = document.getElementById('current-game-title');
    const containerEl = document.getElementById('game-container');

    gameScreen.style.display = 'block';

    if (gameType === 'mine') {
        titleEl.textContent = '⛏️ Шахта (Видобуток)';
        renderMineShaft(containerEl);
    } else if (gameType === 'cases') {
        titleEl.textContent = '📦 Кейси з зірками';
        renderCases(containerEl);
    } else if (gameType === 'dice') {
        titleEl.textContent = '🎲 Кубик (Dice)';
        renderDice(containerEl);
    } else if (gameType === 'mines') {
        titleEl.textContent = '💣 Міни (Mines)';
        renderMines(containerEl);
    } else if (gameType === 'crash') {
        titleEl.textContent = '🚀 Краш (Crash)';
        renderCrash(containerEl);
    }
}

// 1. ШАХТА (КИРКА + ГЛИБИНА + РІДКІСНІ ЗНАХІДКИ)
function renderMineShaft(container) {
    if (!userState.mineLevel) userState.mineLevel = 1;
    if (!userState.mineProgress) userState.mineProgress = 0;

    const ores = [
        { name: 'Камінь', icon: '🪨', reward: 0.10, chance: 0.65 },
        { name: 'Срібна жила', icon: '🪙', reward: 0.25, chance: 0.25 },
        { name: 'Золотий самородок', icon: '🥇', reward: 0.60, chance: 0.08 },
        { name: 'Зоряний кристал', icon: '💎', reward: 2.00, chance: 0.02 }
    ];

    container.innerHTML = `
        <div class="game-panel">
            <div style="display:flex; justify-content:space-between; font-size:13px; color:#a09cc0; margin-bottom:8px;">
                <span>Рівень шахти: <b style="color:#fff;" id="mine-lvl">${userState.mineLevel}</b></span>
                <span>Бонус рівня: <b class="gold-text">+${((userState.mineLevel - 1) * 0.05).toFixed(2)} ⭐️</b></span>
            </div>
            <div class="shaft-box">
                <div id="ore-visual" style="font-size:36px; margin-bottom:6px;">🪨</div>
                <button class="pickaxe-hit-btn" id="pickaxe-btn">⛏️</button>
                <p style="font-size:12px; color:#b3aee0; margin-top:6px;">Бий киркою по породі в шахті!</p>
                <div class="shaft-progress-bar">
                    <div class="shaft-progress-fill" id="shaft-fill" style="width: ${userState.mineProgress}%"></div>
                </div>
                <div style="font-size:11px; color:#8c88af; margin-top:4px;">Прогрес до наступної глибини: <span id="shaft-pct">${userState.mineProgress}%</span></div>
            </div>
            <div class="game-status-msg gold-text" id="mine-msg">Вдар киркою, щоб почати видобуток!</div>
        </div>
    `;

    const btn = document.getElementById('pickaxe-btn');
    btn.onclick = () => {
        // Вибір руди за ймовірністю
        const r = Math.random();
        let acc = 0;
        let foundOre = ores[0];
        for (const ore of ores) {
            acc += ore.chance;
            if (r <= acc) {
                foundOre = ore;
                break;
            }
        }

        const levelBonus = (userState.mineLevel - 1) * 0.05;
        const totalGain = +(foundOre.reward + levelBonus).toFixed(2);
        userState.balance += totalGain;

        userState.mineProgress += 5;
        if (userState.mineProgress >= 100) {
            userState.mineProgress = 0;
            userState.mineLevel += 1;
            document.getElementById('mine-lvl').textContent = userState.mineLevel;
        }

        saveState();

        document.getElementById('ore-visual').textContent = foundOre.icon;
        document.getElementById('shaft-fill').style.width = `${userState.mineProgress}%`;
        document.getElementById('shaft-pct').textContent = `${userState.mineProgress}%`;

        const msgEl = document.getElementById('mine-msg');
        msgEl.textContent = `${foundOre.icon} ${foundOre.name}: +${totalGain.toFixed(2)} ⭐️`;
        msgEl.className = foundOre.reward >= 0.60 ? 'game-status-msg green-text' : 'game-status-msg gold-text';

        btn.style.transform = 'rotate(-25deg) scale(0.9)';
        setTimeout(() => { btn.style.transform = 'rotate(0deg) scale(1)'; }, 90);

        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    };
}

// 2. КЕЙСИ
function renderCases(container) {
    const casesData = [
        {
            id: 'bronze',
            name: 'Бронзовий кейс',
            icon: '📦',
            price: 15,
            desc: 'Можливий дроп: від 2 ⭐️ до 40 ⭐️',
            rewards: [
                { val: 2, chance: 0.45 },
                { val: 8, chance: 0.30 },
                { val: 18, chance: 0.18 },
                { val: 40, chance: 0.07 }
            ]
        },
        {
            id: 'silver',
            name: 'Срібний кейс',
            icon: '🧰',
            price: 50,
            desc: 'Можливий дроп: від 10 ⭐️ до 150 ⭐️',
            rewards: [
                { val: 10, chance: 0.48 },
                { val: 30, chance: 0.30 },
                { val: 75, chance: 0.16 },
                { val: 150, chance: 0.06 }
            ]
        },
        {
            id: 'gold',
            name: 'Зоряний мега-кейс',
            icon: '👑',
            price: 150,
            desc: 'Можливий дроп: від 35 ⭐️ до 500 ⭐️',
            rewards: [
                { val: 35, chance: 0.50 },
                { val: 100, chance: 0.30 },
                { val: 250, chance: 0.15 },
                { val: 500, chance: 0.05 }
            ]
        }
    ];

    container.innerHTML = `
        <div id="case-result-box" class="case-open-result" style="display:none;"></div>
        <div class="cases-list">
            ${casesData.map(c => `
                <div class="case-item-card">
                    <div class="case-left">
                        <div class="case-emoji">${c.icon}</div>
                        <div>
                            <div class="case-title">${c.name}</div>
                            <div class="case-desc">${c.desc}</div>
                        </div>
                    </div>
                    <button class="action-btn gold-btn" onclick="openCaseBox('${c.id}')">${c.price} ⭐️</button>
                </div>
            `).join('')}
        </div>
    `;

    window.openCaseBox = (caseId) => {
        const selected = casesData.find(x => x.id === caseId);
        if (!selected) return;
        if (!validateBet(selected.price)) return;

        userState.balance -= selected.price;
        userState.gamesPlayed += 1;

        const r = Math.random();
        let acc = 0;
        let wonStars = selected.rewards[0].val;
        for (const item of selected.rewards) {
            acc += item.chance;
            if (r <= acc) {
                wonStars = item.val;
                break;
            }
        }

        userState.balance += wonStars;
        if (wonStars >= selected.price) {
            userState.wins += 1;
        } else {
            userState.losses += 1;
        }
        saveState();

        const resBox = document.getElementById('case-result-box');
        resBox.style.display = 'block';
        const isProfit = wonStars >= selected.price;
        resBox.innerHTML = `
            <div style="font-size:42px; margin-bottom:6px;">${selected.icon}</div>
            <div style="font-size:14px; color:#a09cc0;">Ти відкрив <b>${selected.name}</b> і вибив:</div>
            <div style="font-size:24px; font-weight:900; margin-top:4px;" class="${isProfit ? 'green-text' : 'gold-text'}">
                +${wonStars.toFixed(2)} ⭐️
            </div>
        `;
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(isProfit ? 'success' : 'warning');
    };
}

// 3. DICE (Без трійки: тільки 1-2 або 5-6, 3 і 4 — програш)
function renderDice(container) {
    let selectedChoice = 'more';
    container.innerHTML = `
        <div class="game-panel">
            <p style="color:#a09cc0; font-size:13px;">Обери <b>1–2</b> або <b>5–6</b> (числа 3 та 4 — програш). Виграш <b>x2</b>!</p>
            <div class="dice-display" id="dice-result">🎲</div>
            <div class="dice-choice-row">
                <button class="choice-btn selected" id="btn-more">5 або 6</button>
                <button class="choice-btn" id="btn-less">1 або 2</button>
            </div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="dice-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('dice-bet').value = Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="roll-dice-btn">Кинути кубик</button>
            </div>
            <div class="game-status-msg" id="dice-msg"></div>
        </div>
    `;

    const btnMore = document.getElementById('btn-more');
    const btnLess = document.getElementById('btn-less');

    btnMore.onclick = () => {
        selectedChoice = 'more';
        btnMore.classList.add('selected');
        btnLess.classList.remove('selected');
    };

    btnLess.onclick = () => {
        selectedChoice = 'less';
        btnLess.classList.add('selected');
        btnMore.classList.remove('selected');
    };

    document.getElementById('roll-dice-btn').onclick = () => {
        const bet = parseFloat(document.getElementById('dice-bet').value);
        if (!validateBet(bet)) return;

        userState.balance -= bet;
        userState.gamesPlayed += 1;

        const roll = Math.floor(Math.random() * 6) + 1;
        const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        document.getElementById('dice-result').textContent = `${diceFaces[roll - 1]} (${roll})`;

        const isWin = (selectedChoice === 'more' && (roll === 5 || roll === 6)) ||
                      (selectedChoice === 'less' && (roll === 1 || roll === 2));
        const msgEl = document.getElementById('dice-msg');

        if (isWin) {
            const winAmount = bet * 2;
            userState.balance += winAmount;
            userState.wins += 1;
            msgEl.textContent = `Перемога! Виграш +${winAmount.toFixed(2)} ⭐️`;
            msgEl.className = 'game-status-msg green-text';
        } else {
            userState.losses += 1;
            msgEl.textContent = `Програш! Випало ${roll}.`;
            msgEl.className = 'game-status-msg red-text';
        }
        saveState();
    };
}

// 4. MINES (8 мін на полі)
function renderMines(container) {
    let activeGame = false;
    let betAmount = 0;
    let bombPositions = [];
    let openedCount = 0;
    let currentMultiplier = 1.0;
    const totalBombs = 8;

    container.innerHTML = `
        <div class="game-panel">
            <p style="color:#a09cc0; font-size:13px;">На полі <b>8 мін</b>. Відкривай клітинки та забирай виграш!</p>
            <div class="mines-grid" id="mines-grid"></div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="mines-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('mines-bet').value = Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="mines-action-btn">Почати гру</button>
            </div>
            <div class="game-status-msg" id="mines-msg"></div>
        </div>
    `;

    const gridEl = document.getElementById('mines-grid');
    const actionBtn = document.getElementById('mines-action-btn');
    const msgEl = document.getElementById('mines-msg');

    function buildGrid() {
        gridEl.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('button');
            cell.className = 'mine-cell';
            cell.textContent = '?';
            cell.onclick = () => handleCellClick(i, cell);
            gridEl.appendChild(cell);
        }
    }

    function handleCellClick(index, cell) {
        if (!activeGame || cell.classList.contains('safe')) return;

        if (bombPositions.includes(index)) {
            activeGame = false;
            cell.classList.add('bomb');
            cell.textContent = '💣';
            userState.losses += 1;
            msgEl.textContent = 'Бух! Ти натрапив на міну.';
            msgEl.className = 'game-status-msg red-text';
            actionBtn.textContent = 'Грати знову';
            revealAll();
            saveState();
        } else {
            cell.classList.add('safe');
            cell.textContent = '💎';
            openedCount += 1;
            currentMultiplier = +(1 + openedCount * 0.25).toFixed(2);
            const cashoutVal = (betAmount * currentMultiplier).toFixed(2);
            actionBtn.textContent = `Забрати ${cashoutVal} ⭐️ (x${currentMultiplier})`;
            msgEl.textContent = `Відкрито безпечних: ${openedCount}`;
            msgEl.className = 'game-status-msg green-text';
        }
    }

    function revealAll() {
        const cells = gridEl.querySelectorAll('.mine-cell');
        cells.forEach((c, idx) => {
            if (bombPositions.includes(idx)) {
                c.classList.add('bomb');
                c.textContent = '💣';
            }
        });
    }

    actionBtn.onclick = () => {
        if (activeGame) {
            if (openedCount === 0) {
                alert('Відкрий хоча б одну клітинку!');
                return;
            }
            const win = betAmount * currentMultiplier;
            userState.balance += win;
            userState.wins += 1;
            activeGame = false;
            msgEl.textContent = `Виграш забрано: +${win.toFixed(2)} ⭐️!`;
            msgEl.className = 'game-status-msg gold-text';
            actionBtn.textContent = 'Почати гру';
            revealAll();
            saveState();
        } else {
            const bet = parseFloat(document.getElementById('mines-bet').value);
            if (!validateBet(bet)) return;

            userState.balance -= bet;
            userState.gamesPlayed += 1;
            saveState();

            betAmount = bet;
            activeGame = true;
            openedCount = 0;
            currentMultiplier = 1.0;
            bombPositions = [];

            while (bombPositions.length < totalBombs) {
                const rand = Math.floor(Math.random() * 25);
                if (!bombPositions.includes(rand)) bombPositions.push(rand);
            }

            buildGrid();
            msgEl.textContent = 'Обирай клітинки!';
            msgEl.className = 'game-status-msg';
            actionBtn.textContent = 'Забрати виграш';
        }
    };

    buildGrid();
}

// 5. CRASH (Мінімальний краш від 1.06x, ніколи не на 1.00x)
function renderCrash(container) {
    let isFlying = false;
    let multiplier = 1.00;
    let crashPoint = 1.06;
    let betAmount = 0;

    container.innerHTML = `
        <div class="game-panel">
            <div class="crash-display">
                <div style="font-size:36px; margin-bottom:4px;" id="crash-rocket">🚀</div>
                <div class="crash-multiplier" id="crash-mult">1.00x</div>
            </div>
            <div class="bet-controls">
                <div class="bet-input-row">
                    <input type="number" id="crash-bet" class="bet-input" value="10" min="1">
                    <button class="quick-bet-btn" onclick="document.getElementById('crash-bet').value = Math.floor(userState.balance)">MAX</button>
                </div>
                <button class="play-main-btn" id="crash-action-btn">Зробити ставку</button>
            </div>
            <div class="game-status-msg" id="crash-msg"></div>
        </div>
    `;

    const multEl = document.getElementById('crash-mult');
    const rocketEl = document.getElementById('crash-rocket');
    const actionBtn = document.getElementById('crash-action-btn');
    const msgEl = document.getElementById('crash-msg');

    actionBtn.onclick = () => {
        if (isFlying) {
            clearInterval(crashInterval);
            isFlying = false;
            const win = betAmount * multiplier;
            userState.balance += win;
            userState.wins += 1;
            msgEl.textContent = `Успіх! Виведено ${win.toFixed(2)} ⭐️ на ${multiplier.toFixed(2)}x`;
            msgEl.className = 'game-status-msg green-text';
            actionBtn.textContent = 'Зробити ставку';
            saveState();
        } else {
            const bet = parseFloat(document.getElementById('crash-bet').value);
            if (!validateBet(bet)) return;

            userState.balance -= bet;
            userState.gamesPlayed += 1;
            saveState();

            betAmount = bet;
            isFlying = true;
            multiplier = 1.00;

            // Точка крашу суворо від 1.06x і вище
            const r = Math.random();
            if (r < 0.45) {
                crashPoint = +(1.06 + Math.random() * 0.34).toFixed(2); // 1.06x - 1.40x
            } else if (r < 0.80) {
                crashPoint = +(1.41 + Math.random() * 1.09).toFixed(2); // 1.41x - 2.50x
            } else {
                crashPoint = +(2.51 + Math.random() * 3.50).toFixed(2); // 2.51x - 6.00x
            }

            rocketEl.textContent = '🚀';
            multEl.style.color = '#f1c40f';
            multEl.textContent = '1.00x';
            msgEl.textContent = 'Ракета летить...';
            msgEl.className = 'game-status-msg';
            actionBtn.textContent = `Забрати ${(betAmount * multiplier).toFixed(2)} ⭐️`;

            crashInterval = setInterval(() => {
                multiplier = +(multiplier + 0.03).toFixed(2);

                if (multiplier >= crashPoint) {
                    clearInterval(crashInterval);
                    isFlying = false;
                    multEl.textContent = `${crashPoint.toFixed(2)}x`;
                    rocketEl.textContent = '💥';
                    multEl.style.color = '#e74c3c';
                    userState.losses += 1;
                    msgEl.textContent = `Краш на ${crashPoint.toFixed(2)}x! Ставка згоріла.`;
                    msgEl.className = 'game-status-msg red-text';
                    actionBtn.textContent = 'Зробити ставку';
                    saveState();
                    return;
                }

                multEl.textContent = `${multiplier.toFixed(2)}x`;
                actionBtn.textContent = `Забрати ${(betAmount * multiplier).toFixed(2)} ⭐️`;
            }, 80);
        }
    };
}

// Ініціалізація при старті
initTelegramProfile();
updateUI();