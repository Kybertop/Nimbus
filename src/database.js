const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'users.json');

function ensureDir() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAll() {
    ensureDir();
    if (!fs.existsSync(DB_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

function writeAll(data) {
    ensureDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getUser(userId) {
    const all = readAll();
    return all[userId] || null;
}

function setUser(userId, data) {
    const all = readAll();
    all[userId] = { ...(all[userId] || {}), ...data };
    writeAll(all);
    return all[userId];
}

function deleteUser(userId) {
    const all = readAll();
    delete all[userId];
    writeAll(all);
}

function getAllUsers() {
    return readAll();
}

// ─── Notifikácie ───────────────────────────

function addNotification(userId, notification) {
    const all = readAll();
    if (!all[userId]) return null;
    if (!all[userId].notifications) all[userId].notifications = [];
    // Najdi najvyssie cislo a pridaj +1
    const maxId = all[userId].notifications.reduce((max, n) => {
        const num = parseInt(n.id);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    const id = String(maxId + 1);
    const notif = { id, ...notification, enabled: true };
    all[userId].notifications.push(notif);
    writeAll(all);
    return notif;
}

function removeNotification(userId, notifId) {
    const all = readAll();
    if (!all[userId]?.notifications) return false;
    const before = all[userId].notifications.length;
    all[userId].notifications = all[userId].notifications.filter(n => n.id !== notifId);
    writeAll(all);
    return all[userId].notifications.length < before;
}

function toggleNotification(userId, notifId) {
    const all = readAll();
    const notif = all[userId]?.notifications?.find(n => n.id === notifId);
    if (!notif) return null;
    notif.enabled = !notif.enabled;
    writeAll(all);
    return notif;
}

// ─── Obľúbené mestá ────────────────────────

function addFavorite(userId, city) {
    const all = readAll();
    if (!all[userId]) return null;
    if (!all[userId].favorites) all[userId].favorites = [];
    // Max 10 obľúbených
    if (all[userId].favorites.length >= 10) return null;
    // Bez duplikátov
    if (all[userId].favorites.some(f => f.name === city.name && f.latitude === city.latitude)) return null;
    all[userId].favorites.push(city);
    writeAll(all);
    return city;
}

function removeFavorite(userId, index) {
    const all = readAll();
    if (!all[userId]?.favorites?.[index]) return false;
    all[userId].favorites.splice(index, 1);
    writeAll(all);
    return true;
}

function getFavorites(userId) {
    const all = readAll();
    return all[userId]?.favorites || [];
}

// ─── Storm alert tracking ──────────────────

function getAlertState(userId) {
    const all = readAll();
    return all[userId]?._lastAlert || null;
}

function setAlertState(userId, state) {
    const all = readAll();
    if (!all[userId]) return;
    all[userId]._lastAlert = state;
    writeAll(all);
}

// ─── Server config (guild-level) ───────────

const SERVERS_PATH = path.join(__dirname, '..', 'data', 'servers.json');

function readServers() {
    ensureDir();
    if (!fs.existsSync(SERVERS_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(SERVERS_PATH, 'utf-8')); } catch { return {}; }
}

function writeServers(data) {
    ensureDir();
    fs.writeFileSync(SERVERS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getServer(guildId) {
    return readServers()[guildId] || null;
}

function setServer(guildId, data) {
    const all = readServers();
    all[guildId] = { ...(all[guildId] || {}), ...data };
    writeServers(all);
    return all[guildId];
}

function getAllServers() {
    return readServers();
}

function deleteServer(guildId) {
    const all = readServers();
    delete all[guildId];
    writeServers(all);
}

module.exports = {
    getUser, setUser, deleteUser, getAllUsers,
    addNotification, removeNotification, toggleNotification,
    addFavorite, removeFavorite, getFavorites,
    getAlertState, setAlertState,
    getServer, setServer, getAllServers, deleteServer,
};
