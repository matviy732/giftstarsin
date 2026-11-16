// Ініціалізація Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Стан користувача (зберігається в localStorage)
let userState = JSON.parse(localStorage.getItem('giftstarsin_state')) || {
    balance: 100.00,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    lastBonusDate: null
};

// Збереження стану
function saveState() {
    localStorage.setItem('giftstarsin_state', JSON.stringify(userState));
    updateUI();
}

// Оновлення інтерфейсу (баланс, статистика, профіль)
function updateUI() {
    const formattedBalance = userState.balance.toFixed(2);
    document.getElementById('balance-amount').textContent = formattedBalance;
    document.getElementById('stat-balance').textContent = `${formattedBalance} ⭐️`;
    document.getElementById('stat-games').textContent = userState.gamesPlayed;
    document.getElementById('stat-wins').textContent = userState.wins;
    document.getElementById('stat-losses').textContent = userState.losses;
    renderLeaders();
}

// Підтягування даних користувача з Telegram
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

// Перемикання вкладок нижньої навігації
function switchTab(tabName) {
    closeGame();
    document.querySelectorAll('.tab-view').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`tab-${tabName}`).style.display = 'block';
    document.getElementById(`nav-${tabName}`).classList.add('active');
}

// Щоденний бонус
function claimDailyBonus() {
    const today = new Date().toDateString();
    if (userState.lastBonusDate === today) {
        alert('Ти вже забрав сьогоднішній бонус! Повертайся завтра.');
        return;
    }
    userState.balance += 50;
    userState.lastBonusDate = today;
    saveState();
    alert('Вітаємо! Отримано +50.00 ⭐️');
}

// Поповнення демо-балансу при натисканні на "+"
function addDemoBalance() {
    if (userState.balance < 10) {
        userState.balance += 100;
        saveState();
        alert('Демо-баланс поповнено на +100.00 ⭐️!');
    } else {
        switchTab('contests');
    }
}

// Запрошення друзів через Telegram
function inviteFriend() {
    const shareText = 'Грай у мініігри та збирай зірочки в GiftStarsin! ⭐️';
    const appUrl = 'https://t.me/GiftStartGameBot';
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`);
    } else {
        alert('Посилання для запрошення: ' + appUrl);
    }
}

// Демо-таблиця лідерів
function renderLeaders() {
    const currentUserName = document.getElementById('profile-name').textContent;
    const leaders = [
        { name: 'CryptoKing', score: 1540.50 },
        { name: 'StarHunter', score: 980.00 },
        { name: currentUserName + ' (Ти)', score: userState.balance },
        { name: 'LuckyFox', score: 420.25 },
        { name: 'Alex_UA', score: 215.00 }
    ];

    leaders.sort((a, b) => b.score - a.score);

    const listEl = document.getElementById('leaders-list');
    listEl.innerHTML = leaders.map((player, idx) => `
        <div class="leader-row">
            <div class="leader-left">
                <span class="leader-rank">#${idx + 1}</span>
                <span>${player.name}</span>
            </div>
            <strong>${player.score.toFixed(2)} ⭐️</strong>
        </div>
    `).join('');
}

// Заглушки відкриття/закриття ігор (наповнимо на наступному кроці)
function openGame(gameType) {
    document.querySelectorAll('.tab-view').forEach(tab => tab.style.display = 'none');
    const gameScreen = document.getElementById('game-screen');
    const titleEl = document.getElementById('current-game-title');
    const containerEl = document.getElementById('game-container');

    const titles = {
        crash: '🚀 Краш (Crash)',
        dice: '🎲 Кубик (Dice)',
        mines: '💣 Міни (Mines)',
        clicker: '⛏️ Клікер (Clicker)'
    };

    titleEl.textContent = titles[gameType] || 'Мінігра';
    containerEl.innerHTML = `<p style="text-align:center; padding: 40px 0; color: #a09cc0;">Завантаження гри ${titles[gameType]}...</p>`;
    gameScreen.style.display = 'block';
}

function closeGame() {
    document.getElementById('game-screen').style.display = 'none';
}

function openSettings() {
    if (confirm('Скинути весь прогрес і відновити початковий баланс 100 ⭐️?')) {
        localStorage.removeItem('giftstarsin_state');
        location.reload();
    }
}

// Запуск при завантаженні
initTelegramProfile();
updateUI();