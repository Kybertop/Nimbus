# Spolupráca na Weather Bot

## Setup (prvýkrát)

### 1. Klonuj repo
```bash
git clone https://github.com/TVOJ-USERNAME/nimbus.git
cd nimbus
npm install
cp .env.example .env
# vyplň .env
```

### 2. Registruj commandy
```bash
npm run deploy
```

### 3. Spusti bota
```bash
npm start
# alebo cez PM2:
pm2 start src/index.js --name nimbus
```

---

## Pravidlá pre spoluprácu

### Branches

```
main          ← produkčný kód, vždy funguje
├── dev       ← vývojová vetva, merge sem pred main
├── feat/xyz  ← nová funkcia
├── fix/xyz   ← oprava bugu
└── pato/xyz  ← tvoje experimenty
```

### Workflow

1. **Nikdy nepushuj priamo do `main`!**
2. Vytvor branch pre každú zmenu:
   ```bash
   git checkout -b feat/novy-command
   ```
3. Commituj a pushni:
   ```bash
   git add .
   git commit -m "feat: pridany /novy command"
   git push origin feat/novy-command
   ```
4. Na GitHube vytvor **Pull Request** do `main`
5. Druhý človek skontroluje a mergne

### Commit správy

Použi formát:
```
feat: nová funkcia
fix: oprava bugu
refactor: zmena kódu bez novej funkcie
docs: dokumentácia
style: formátovanie
```

Príklady:
```
feat: pridany /mesiac command
fix: opraveny API 400 error v getDailyForecast
refactor: zjednotene button rows do buildWeatherRows
docs: aktualizovany README
```

---

## Ak sa niečo pokazí

### Merge konflikty
```bash
# Ak git pull zlyhá s konfliktom:
git stash                    # odlož tvoje zmeny
git pull origin main         # stiahni najnovšie
git stash pop                # aplikuj tvoje zmeny späť
# Vyries konflikty v súboroch, potom:
git add .
git commit -m "fix: resolved merge conflict"
```

### Rollback na poslednú fungujúcu verziu
```bash
git log --oneline -10        # nájdi hash posledného dobrého commitu
git revert HEAD              # vráť posledný commit
# alebo tvrdý reset:
git reset --hard abc1234     # POZOR: stratíš neuložené zmeny!
```

### Niečo sa rozbilo po pulle
```bash
npm install                  # reinstall dependencies
npm run deploy               # re-register commands (ak sa zmenili)
pm2 restart nimbus      # restart
```

---

## Auto-update na serveri

### Windows (Task Scheduler)
1. Otvor Task Scheduler
2. Create Basic Task → "Weather Bot Update"
3. Trigger: Daily, every 1 minute (alebo ako chceš)
4. Action: Start a Program → `scripts\auto-update.bat`
5. Start in: `C:\Users\Kayle\Desktop\nimbus`

### Alebo nechaj bežať watcher:
```bash
scripts\watch-updates.bat
```
Toto beží v slučke a každých 60 sekúnd checkne GitHub.

### Linux (cron)
```bash
# Otvor crontab
crontab -e
# Pridaj (každú minútu):
* * * * * /cesta/k/nimbus/scripts/auto-update.sh >> /var/log/nimbus-update.log 2>&1
```

---

## Štruktúra projektu

```
nimbus/
├── .env.example          # šablóna pre environment
├── .gitignore            # ignorované súbory
├── package.json          # dependencies
├── CONTRIBUTING.md       # tento súbor
├── README.md             # hlavná dokumentácia
├── scripts/
│   ├── auto-update.sh    # Linux auto-update
│   ├── auto-update.bat   # Windows auto-update  
│   └── watch-updates.bat # Windows watcher
├── data/                 # ← IGNOROVANÉ v gite (user data)
│   ├── users.json
│   └── servers.json
└── src/
    ├── index.js          # vstupný bod
    ├── commands.js       # slash commandy
    ├── deploy-commands.js# registrácia
    ├── handlers.js       # interakcie
    ├── database.js       # per-user storage
    ├── weather.js        # Open-Meteo API
    ├── embeds.js         # Discord embedy
    ├── namedays.js       # slovenské meniny
    └── notifications.js  # cron notifikácie
```
