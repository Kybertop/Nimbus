// BOM-safe .env loader
{
    const fs = require('fs');
    const envPath = require('path').join(__dirname, '..', '.env');
    try {
        const raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx === -1) continue;
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (key && !(key in process.env)) process.env[key] = val;
        }
        console.log('[env] Loaded from', envPath);
    } catch (err) {
        console.error('[env] Could not read .env:', err.message);
    }
}

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.WEB_PORT || 3000;

const CLIENT_ID      = process.env.CLIENT_ID;
const CLIENT_SECRET  = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI   = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const DB_PATH        = path.join(__dirname, '..', 'data', 'users.json');

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing CLIENT_ID or DISCORD_CLIENT_SECRET in .env');
    process.exit(1);
}

const fs2 = require('fs');
const SESSIONS_FILE = require('path').join(__dirname, 'data', 'sessions.json');

function loadSessions() {
    try {
        const dir = require('path').dirname(SESSIONS_FILE);
        if (!fs2.existsSync(dir)) fs2.mkdirSync(dir, { recursive: true });
        if (fs2.existsSync(SESSIONS_FILE)) {
            const data = JSON.parse(fs2.readFileSync(SESSIONS_FILE, 'utf8'));
            return new Map(Object.entries(data));
        }
    } catch (e) { console.error('Failed to load sessions:', e); }
    return new Map();
}

function saveSessions() {
    try {
        const dir = require('path').dirname(SESSIONS_FILE);
        if (!fs2.existsSync(dir)) fs2.mkdirSync(dir, { recursive: true });
        const obj = Object.fromEntries(sessions);
        fs2.writeFileSync(SESSIONS_FILE, JSON.stringify(obj), 'utf8');
    } catch (e) { console.error('Failed to save sessions:', e); }
}

const sessions = loadSessions();

function createSession(userData) {
    const id = crypto.randomBytes(32).toString('hex');
    sessions.set(id, { ...userData, createdAt: Date.now() });
    saveSessions();
    return id;
}

function getSession(req) {
    const raw = req.headers.cookie || '';
    const match = raw.match(/nimbus_session=([a-f0-9]+)/);
    if (!match) return null;
    const session = sessions.get(match[1]);
    if (!session || Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
        if (match[1]) { sessions.delete(match[1]); saveSessions(); }
        return null;
    }
    return session;
}

function setSessionCookie(res, sessionId) {
    res.setHeader('Set-Cookie',
        `nimbus_session=${sessionId}; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    );
}

function clearSessionCookie(res) {
    res.setHeader('Set-Cookie', 'nimbus_session=; Path=/; Max-Age=0');
}

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
    setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
        if (filePath.endsWith('.js') || filePath.endsWith('.css'))
            res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    },
}));

function requireAuth(req, res, next) {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    req.session = session;
    next();
}

function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) return {};
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch { return {}; }
}

function writeDB(data) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/auth/login', (req, res) => {
    const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         'identify',
    });
    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error || !code) return res.redirect('/?auth=denied');
    try {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id:     CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type:    'authorization_code',
                code,
                redirect_uri:  REDIRECT_URI,
            }),
        });
        if (!tokenRes.ok) { console.error('[OAuth]', await tokenRes.text()); return res.redirect('/?auth=error'); }
        const tokens = await tokenRes.json();

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!userRes.ok) { console.error('[OAuth]', await userRes.text()); return res.redirect('/?auth=error'); }
        const u = await userRes.json();

        const sessionId = createSession({
            discordId:     u.id,
            username:      u.username,
            displayName:   u.global_name || u.username,
            avatar:        u.avatar,
            discriminator: u.discriminator || '0',
        });

        setSessionCookie(res, sessionId);
        console.log(`[Auth] ${u.username} (${u.id}) logged in`);
        res.redirect('/');
    } catch (err) {
        console.error('[OAuth]', err);
        res.redirect('/?auth=error');
    }
});

app.post('/auth/logout', (req, res) => {
    const raw = req.headers.cookie || '';
    const match = raw.match(/nimbus_session=([a-f0-9]+)/);
    if (match) { sessions.delete(match[1]); saveSessions(); }
    clearSessionCookie(res);
    res.json({ ok: true });
});

const DEVELOPER_IDS = ['562024534958538783', '252163630576041994'];

app.get('/auth/me', (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    const avatarUrl = session.avatar
        ? `https://cdn.discordapp.com/avatars/${session.discordId}/${session.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(session.discriminator || 0) % 5}.png`;
    res.json({ id: session.discordId, username: session.username, displayName: session.displayName, avatarUrl, developer: DEVELOPER_IDS.includes(session.discordId) });
});

app.get('/api/me', requireAuth, (req, res) => {
    res.json(readDB()[req.session.discordId] || {});
});

app.patch('/api/me', requireAuth, (req, res) => {
    const db = readDB(); const id = req.session.discordId;
    if (!db[id]) db[id] = {};
    const { notifications, favorites, _lastAlert, ...safe } = req.body;
    db[id] = { ...db[id], ...safe };
    writeDB(db); res.json(db[id]);
});

app.delete('/api/me', requireAuth, (req, res) => {
    const db = readDB();
    delete db[req.session.discordId];
    writeDB(db); res.json({ ok: true });
});

app.post('/api/me/notifications', requireAuth, (req, res) => {
    const db = readDB(); const id = req.session.discordId;
    if (!db[id]) db[id] = {};
    if (!db[id].notifications) db[id].notifications = [];
    const notifId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const notif = { id: notifId, ...req.body, enabled: true };
    db[id].notifications.push(notif);
    writeDB(db); res.json(notif);
});

app.delete('/api/me/notifications/:notifId', requireAuth, (req, res) => {
    const db = readDB(); const id = req.session.discordId;
    if (!db[id]?.notifications) return res.status(404).json({ error: 'Not found' });
    db[id].notifications = db[id].notifications.filter(n => n.id !== req.params.notifId);
    writeDB(db); res.json({ ok: true });
});

app.patch('/api/me/notifications/:notifId', requireAuth, (req, res) => {
    const db = readDB(); const id = req.session.discordId;
    const notif = db[id]?.notifications?.find(n => n.id === req.params.notifId);
    if (!notif) return res.status(404).json({ error: 'Not found' });
    const body = req.body || {};
    if (Object.keys(body).length === 0) {
        notif.enabled = !notif.enabled;
    } else {
        const editable = ['enabled', 'channel_id', 'hour', 'minute', 'event_based',
            'offset_minutes', 'watch_changes', 'watch_severe', 'watch_moon',
            'destination', 'type'];
        for (const key of editable) {
            if (key in body) notif[key] = body[key];
        }
    }
    writeDB(db); res.json(notif);
});

app.post('/api/me/favorites', requireAuth, (req, res) => {
    const db = readDB(); const id = req.session.discordId;
    if (!db[id]) db[id] = {};
    if (!db[id].favorites) db[id].favorites = [];
    const favs = db[id].favorites;
    if (favs.length >= 10) return res.status(400).json({ error: 'Max 10' });
    const fav = req.body;
    if (favs.some(f => f.name === fav.name && f.latitude === fav.latitude))
        return res.status(400).json({ error: 'Already exists' });
    favs.push(fav); writeDB(db); res.json(fav);
});

app.delete('/api/me/favorites/:idx', requireAuth, (req, res) => {
    const db = readDB(); const id = req.session.discordId;
    const idx = parseInt(req.params.idx);
    if (!db[id]?.favorites) return res.status(404).json({ error: 'Not found' });
    db[id].favorites.splice(idx, 1);
    writeDB(db); res.json({ ok: true });
});

app.get('/api/channels', requireAuth, async (req, res) => {
    const BOT_TOKEN = process.env.DISCORD_TOKEN;
    if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });
    const userId = req.session.discordId;
    try {
        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
        });
        if (!guildsRes.ok) return res.status(502).json({ error: 'Failed to fetch guilds' });
        const allGuilds = await guildsRes.json();
        const results = [];
        for (const guild of allGuilds) {
            const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/members/${userId}`, {
                headers: { Authorization: `Bot ${BOT_TOKEN}` },
            });
            if (!memberRes.ok) continue;
            const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
                headers: { Authorization: `Bot ${BOT_TOKEN}` },
            });
            if (!channelsRes.ok) continue;
            const channels = await channelsRes.json();
            const textChannels = channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name, guild: guild.name, guildId: guild.id }));
            results.push(...textChannels);
        }
        res.json(results);
    } catch (err) {
        console.error('[Channels]', err);
        res.status(500).json({ error: 'Internal error' });
    }
});

app.listen(PORT, () => console.log(`⛅ Nimbus Web running on http://localhost:${PORT}`));
