# ⛅ Nimbus — Discord počasie bot

Slovenský Discord bot na zobrazenie počasia s per-user nastaveniami, automatickými notifikáciami a predpoveďou na viac dní. Používa **Open-Meteo API** (free, bez API kľúča).

---

## Funkcie

- **`/pocasie`** — aktuálne počasie s buttonmi na prepínanie medzi dneškom, 7 a 14 dňami
- **`/nastavenia`** — interaktívny dashboard — mesto, jednotky, notifikácie, reset — všetko na jednom mieste
- **`/notifikacie`** — prehľad a správa notifikácií — zapni/vypni/odstrán cez select menu a buttony
- Každý používateľ má vlastné nastavenia (mesto, jednotky, notifikácie)
- Inteligentné zhrnutie dňa — upozornenia na búrky, dážď, s hodinami a %
- Farebné embedy podľa počasia

---

## Ako to funguje

### `/nastavenia` — všetko v jednom

Spustíš command a dostaneš dashboard s tvojimi nastaveniami. Pod ním sú tlačidlá:

- **📍 Nastaviť mesto** — otvorí sa ti modal, napíšeš mesto, ak je viac výsledkov vyberieš cez select menu
- **🌡️ Jednotky** — vyberieš °C/°F a km/h / m/s / mph
- **🔔 Pridať notifikáciu** — modal na čas (HH:MM) a typ (denne / výstrahy)
- **🗑️ Vymazať všetko** — s potvrdením
- **Hotovo** — zatvorí buttony

### `/pocasie`

Zobrazí aktuálne počasie a pod tým buttony na ďalšie pohľady:
- 📋 Dnes podrobne (hodinová analýza s upozorneniami)
- 📆 7 dní
- 📅 14 dní

Prepínaš medzi nimi kliknutím — žiadne ďalšie commandy.

Chceš jednorazovo iné mesto? `/pocasie mesto:Košice` — nezmení tvoje nastavenia.

### `/notifikacie`

Zobrazí zoznam tvojich notifikácií. Cez select menu vyberieš konkrétnu a môžeš ju zapnúť/vypnúť/odstrániť.

**Typy notifikácií:**
- **Denný prehľad** — každý deň v nastavenom čase prehľad počasia s upozorneniami
- **Len výstrahy** — pošle správu len ak sa očakávajú búrky alebo silný dážď

---

## Inštalácia

### 1. Požiadavky

- **Node.js** 18+
- Discord aplikácia + bot token

### 2. Discord aplikácia

1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**
2. **Bot** → Reset Token → skopíruj token
3. **OAuth2** → skopíruj Client ID
4. Pozvi bota:
   ```
   https://discord.com/oauth2/authorize?client_id=TVOJ_CLIENT_ID&scope=bot%20applications.commands&permissions=2048
   ```

### 3. Setup

```bash
cd weather-bot
npm install
cp .env.example .env
# vyplň .env s tvojim tokenom a client ID
```

### 4. Registrácia commandov (raz)

```bash
npm run deploy
```

### 5. Spustenie

```bash
npm start
```

---

## Štruktúra

```
weather-bot/
├── .env.example
├── package.json
├── data/users.json        ← automaticky vytvorený
└── src/
    ├── index.js           ← vstupný bod
    ├── commands.js        ← 3 slash commandy
    ├── deploy-commands.js ← registrácia
    ├── handlers.js        ← interakcie, wizard, buttony, modaly
    ├── database.js        ← per-user JSON storage
    ├── weather.js         ← Open-Meteo API + WMO kódy
    ├── embeds.js          ← Discord embed buildery
    └── notifications.js   ← cron notifikácie
```

---

## Produkčný beh

```bash
npm install -g pm2
pm2 start src/index.js --name weather-bot
pm2 save
```
