<div align="center">

# Nimbus

**Slovak Discord weather bot — real-time forecasts, smart alerts, and lunar tracking.**

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Open-Meteo](https://img.shields.io/badge/API-Open--Meteo-FF6F00?style=flat-square)](https://open-meteo.com)
[![License](https://img.shields.io/badge/license-ISC-blue?style=flat-square)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Kybertop/Nimbus?style=flat-square)](https://github.com/Kybertop/Nimbus/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/Kybertop/Nimbus?style=flat-square)](https://github.com/Kybertop/Nimbus)

[Invite Bot](https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=2147485696) · [Report Bug](https://github.com/Kybertop/Nimbus/issues) · [Request Feature](https://github.com/Kybertop/Nimbus/issues)

</div>

---

## About

Nimbus is a feature-rich Discord weather bot built for the Slovak community. It provides real-time weather data, smart clothing recommendations, traffic warnings, lunar calendar, and a powerful notification system — all in Slovak language.

**Key highlights:**
- Free API — no keys needed (Open-Meteo)
- User-installable — works in DMs, group chats, and foreign servers
- Per-user settings — each user has their own city, units, favorites, and notifications
- Live bot status — displays current temperature in its Discord presence
- Auto-deploy — GitHub push to auto-pull on server within 60 seconds

---

## Commands

### Everywhere (servers, DMs, group chats)

| Command | Description |
|---------|-------------|
| `/pocasie` | Current weather with interactive buttons for daily, 7-day, 14-day views |
| `/pocasie mesto:Praha` | One-time lookup for a different city |
| `/pocasie mesto2:Kosice` | Side-by-side comparison of two cities |
| `/vzduch` | Air quality — European AQI, PM2.5, PM10, NO2, O3, SO2 |
| `/radar` | Live precipitation radar link (RainViewer) |
| `/mesiac` | 14-day lunar calendar with phase calculations |
| `/outfit` | Clothing recommendation based on temp, rain, wind, UV |
| `/doprava` | Traffic warnings — frost, fog, wind, heavy rain, storms |
| `/oblubene` | Manage up to 10 favorite cities with quick switching |
| `/nastavenia` | Interactive settings dashboard |
| `/notifikacie` | View and manage all notifications |
| `/poll` | Weather-based poll — pick a day, vote with reactions |
| `/help` | Interactive help with section buttons |

### Server only

| Command | Description |
|---------|-------------|
| `/kanal` | Set up automatic daily weather posts (admin) |

---

## Interactive buttons

Every `/pocasie` response includes two rows of interactive buttons:

**Row 1:** Current · Today · 7 days · 14 days

**Row 2:** Air · Nice days? · Outfit · Traffic · vs Average

The active view is highlighted green. Buttons carry the city context, so one-time city lookups persist through button clicks.

---

## Notification system

Nimbus has a wizard-driven notification system with 5 main categories:

**Daily overview** — full day summary at a set time or instantly

**Warnings** — pick specific types via multi-select:
- Rain · Storm · Extreme temp · Snow · Fog · Wind · Frost

**Weather changes** — alert when conditions shift:
- Sunny to cloudy · Rain starts/stops · Snow · Storm · Fog · Wind increase · Temp drop/rise

**Sun** — sunrise/sunset with 0-60 min offset

**Moon** — alert on selected lunar phases:
- New moon · First quarter · Full moon · Last quarter

All notifications support **DM or server channel** delivery. Existing notifications can be edited — add/remove tracked types without recreating.

---

## Features

### Weather data
- Current conditions with feels-like temperature
- Hourly ASCII temperature graph (24h)
- 7 and 14 day forecasts with sparkline charts
- UV index with SPF recommendations (5 levels)
- Historical comparison — today vs 5-year average
- Discord dynamic timestamps for sunrise/sunset (auto-updating countdown)

### Smart features
- Outfit advisor — layers, footwear, accessories based on UV, temp, wind, rain
- Traffic warnings — frost, fog, wind, rain, storms, morning frost prediction

### Server features
- Automatic daily weather posts to a channel
- Voice channel auto-rename with live temperature
- Weather polls with day picker and reaction voting
- Multi-day polls with numbered reactions

### Personalization
- Default view preference (current / today / 7d / 14d)
- Fahrenheit / Celsius + km/h / m/s / mph units
- Up to 10 favorite cities
- Slovak nameday display

### Technical
- Temperature-based embed colors (blue to teal to green to orange to red)
- Animated SVG weather icons (Basmilius Weather Icons)
- File logging with daily rotation
- Crash recovery with PM2 auto-restart
- Live bot status showing current temperature

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Git](https://git-scm.com)
- Discord bot token ([Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
git clone https://github.com/Kybertop/Nimbus.git
cd Nimbus
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-client-id
STATUS_CITY=Trnava
```

### Register commands and start

```bash
npm run deploy
npm start
```

### Production (PM2)

```bash
npm install -g pm2
pm2 start src/index.js --name nimbus
pm2 save
```

### User-installable app

Enable in [Developer Portal](https://discord.com/developers/applications) under Installation, then enable User Install.

---

## Auto-deploy

Nimbus includes auto-deploy scripts for seamless updates:

```bash
# On your server — runs every 60s, pulls changes, restarts bot
scripts/watch-updates.bat     # Windows
scripts/auto-update.sh        # Linux (via cron)
```

Every update automatically runs `npm install`, `npm run deploy`, and `pm2 restart`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full collaboration workflow.

---

## Project structure

```
Nimbus/
├── .env.example
├── .gitignore
├── package.json
├── CONTRIBUTING.md
├── README.md
├── scripts/
│   ├── auto-update.bat
│   ├── auto-update.sh
│   ├── push.bat
│   └── watch-updates.bat
├── data/                    # Runtime (gitignored)
│   ├── users.json
│   └── servers.json
├── logs/                    # Daily logs (gitignored)
└── src/
    ├── index.js             # Entry — client, status, logging, crash recovery
    ├── commands.js          # 12 slash commands with integration types
    ├── deploy-commands.js   # Command registration via REST
    ├── handlers.js          # All interaction handling and wizard flows
    ├── database.js          # JSON file storage
    ├── weather.js           # Open-Meteo API, WMO codes, UV, outfit, traffic
    ├── embeds.js            # All Discord embed builders
    ├── namedays.js          # Slovak nameday calendar (365 days)
    └── notifications.js     # Cron: scheduled, event, sun, moon, voice
```

---

## Tech stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Discord library | discord.js v14 |
| Weather API | Open-Meteo (free, no key) |
| Historical API | Open-Meteo Archive |
| Air quality | Open-Meteo Air Quality |
| Radar | RainViewer |
| Weather icons | Basmilius Weather Icons (animated SVG) |
| Scheduling | node-cron |
| Process manager | PM2 |
| Storage | JSON files (per-user, per-server) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, branch workflow, and commit conventions.

---

## License

Distributed under the ISC License.

---

<div align="center">

**Built by [Kybertop](https://github.com/Kybertop)**

</div>
