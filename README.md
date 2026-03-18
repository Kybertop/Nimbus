<div align="center">

# Nimbus

**Slovensky Discord pocasovy bot — predpovede, smart alerty a lunarny kalendar.**

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Open-Meteo](https://img.shields.io/badge/API-Open--Meteo-FF6F00?style=flat-square)](https://open-meteo.com)
[![License](https://img.shields.io/badge/licencia-ISC-blue?style=flat-square)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Kybertop/Nimbus?style=flat-square&label=posledny%20commit)](https://github.com/Kybertop/Nimbus/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/Kybertop/Nimbus?style=flat-square&label=velkost)](https://github.com/Kybertop/Nimbus)

[Pridat bota](https://discord.com/oauth2/authorize?client_id=1483374625541849139&permissions=8&integration_type=0&scope=bot) · [Nahlasit bug](https://github.com/Kybertop/Nimbus/issues) · [Navrh funkcie](https://github.com/Kybertop/Nimbus/issues)

</div>

---

## O projekte

Nimbus je kompletny Discord pocasovy bot postaveny pre slovensku komunitu. Poskytuje data o pocasi v realnom case, odporucania oblecenia, dopravne varovania, lunarny kalendar a prepracovany notifikacny system — vsetko v slovencine.

**Preco Nimbus:**
- Zadarmo API — ziadne kluce (Open-Meteo)
- User-installable — funguje v DMs, skupinovych chatoch aj na cudzich serveroch
- Per-user nastavenia — kazdy uzivatel ma vlastne mesto, jednotky, oblubene a notifikacie
- Zivy status bota — zobrazuje aktualnu teplotu v Discord prezencii

---

## Commandy

### Vsade (servery, DMs, skupinove chaty)

| Command | Popis |
|---------|-------|
| `/pocasie` | Aktualne pocasie s interaktivnymi buttonmi na dnes, 7 a 14 dni |
| `/pocasie mesto:Praha` | Jednorazovy vyber ineho mesta |
| `/pocasie mesto2:Kosice` | Porovnanie dvoch miest vedla seba |
| `/vzduch` | Kvalita vzduchu — European AQI, PM2.5, PM10, NO2, O3, SO2 |
| `/radar` | Zivy radar zrazok (RainViewer) |
| `/mesiac` | 14-dnovy lunarny kalendar s fazami mesiaca |
| `/outfit` | Odporucanie oblecenia podla teploty, dazda, vetra a UV |
| `/doprava` | Dopravne varovania — namraza, hmla, vietor, dazd, burky |
| `/oblubene` | Sprava az 10 oblubenych miest s rychlym prepinanim |
| `/nastavenia` | Interaktivny dashboard nastaveni |
| `/notifikacie` | Zobrazenie a sprava notifikacii |
| `/poll` | Hlasovanie podla predpovede — vyber den, hlasuj reakciami |
| `/help` | Interaktivny help s buttonmi na sekcie |

### Len na serveri

| Command | Popis |
|---------|-------|
| `/kanal` | Nastavenie automatickeho ranneho pocasia do kanala (admin) |

---

## Interaktivne buttony

Kazda odpoved na `/pocasie` obsahuje dva rady buttonov:

**Rad 1:** Aktualne · Dnes · 7 dni · 14 dni

**Rad 2:** Vzduch · Pekne? · Oblecenie · Doprava · vs Priemer

Aktivny pohlad svieti zeleno. Buttony si pamataju mesto, takze jednorazove vyhladavanie pretrvava cez kliknutia.

---

## Notifikacny system

Nimbus ma wizard-driven notifikacny system s 5 hlavnymi kategoriami:

**Ranny prehlad** — celkovy prehlad dna v nastaveny cas alebo okamzite

**Vystrahy** — vyber konkretne typy cez multi-select:
- Dazd · Burka · Extremna teplota · Snezenie · Hmla · Vietor · Namraza

**Zmena pocasia** — alert ked sa zmenia podmienky:
- Zatiahnutie · Vyjasnenie · Zaciatok/koniec dazda · Sneh · Burka · Hmla · Zosilnenie vetra · Pokles/narast teploty

**Slnko** — vychod/zapad s offsetom 0-60 minut pred udalostou

**Mesiac** — alert pri vybranej faze:
- Nov · Prva stvrt · Spln · Posledna stvrt

Vsetky notifikacie podporuju dorucenie do **DM alebo serveroveho kanala**. Existujuce notifikacie sa daju upravovat — pridavat/odoberatelne sledovane typy bez nutnosti vymazania.

---

## Funkcie

### Pocasie a data
- Aktualne podmienky s pocitovou teplotou
- Hodinovy ASCII graf teploty (24h priebeh)
- 7 a 14 dnova predpoved so sparkline grafmi
- UV index s SPF odporuceniami (5 urovni)
- Historicke porovnanie — dnes vs 5-rocny priemer
- Discord dynamicke timestampy pre vychod/zapad slnka (auto-aktualizujuci sa odpocet)

### Smart funkcie
- Poradca oblecenia — vrstvy, obuv, doplnky podla UV, teploty, vetra, dazda
- Dopravne varovania — namraza, hmla, vietor, dazd, burky, predikcia rannej namrazy

### Serverove funkcie
- Automaticky denny post pocasia do kanala
- Voice kanal s automatickym premenovanim podla teploty
- Hlasovanie o pocasi s vyberom dna a reakciami
- Multi-dnove hlasovania s ciselnymi reakciami

### Personalizacia
- Predvoleny pohlad (aktualne / dnes / 7 dni / 14 dni)
- Fahrenheit / Celsius + km/h / m/s / mph jednotky
- Az 10 oblubenych miest
- Slovenske meniny v embedoch

### Technicke
- Farba embedu podla teploty (modra cez zelenu po cervenu)
- Animovane SVG ikony pocasia (Basmilius Weather Icons)
- Logovanie do suborov s dennou rotaciou
- Obnova po padoch s PM2 auto-restartom
- Zivy status bota zobrazujuci aktualnu teplotu

---

## Instalacia

### Poziadavky

- [Node.js](https://nodejs.org) 18+
- [Git](https://git-scm.com)
- Discord bot token ([Developer Portal](https://discord.com/developers/applications))

### Postup

```bash
git clone https://github.com/Kybertop/Nimbus.git
cd Nimbus
npm install
cp .env.example .env
```

Uprav `.env` s tvojimi udajmi:

```env
DISCORD_TOKEN=discord-token-sem
CLIENT_ID=client-id-sem
DISCORD_CLIENT_SECRET=client-secret-sem
REDIRECT_URI=redirect-uri-sem
```

### Registracia commandov a spustenie

```bash
npm run deploy
npm start
```

### Produkcia (PM2)

```bash
npm install -g pm2
pm2 start src/index.js --name nimbus
pm2 save
```

---

## Struktura projektu

```
Nimbus/
├── .env.example
├── .gitignore
├── package.json
├── CONTRIBUTING.md
├── README.md
├── data/                    # Runtime data (gitignored)
│   ├── users.json
│   └── servers.json
├── logs/                    # Denne logy (gitignored)
└── src/
    ├── index.js             # Vstup — klient, status, logovanie, crash recovery
    ├── commands.js          # 12 slash commandov s integration types
    ├── deploy-commands.js   # Registracia commandov cez REST
    ├── handlers.js          # Vsetky interakcie a wizard flows
    ├── database.js          # JSON file storage
    ├── weather.js           # Open-Meteo API, WMO kody, UV, outfit, doprava
    ├── embeds.js            # Vsetky Discord embed buildery
    ├── namedays.js          # Slovensky kalendar menin (365 dni)
    └── notifications.js     # Cron: planovane, event, slnko, mesiac, voice
```

---

## Technologie

| Komponent | Technologia |
|-----------|------------|
| Runtime | Node.js 18+ |
| Discord kniznica | discord.js v14 |
| Pocasie API | Open-Meteo (zadarmo, bez kluca) |
| Historicke data | Open-Meteo Archive |
| Kvalita vzduchu | Open-Meteo Air Quality |
| Radar | RainViewer |
| Ikony pocasia | Basmilius Weather Icons (animovane SVG) |
| Planovanie | node-cron |
| Process manager | PM2 |
| Ulozisko | JSON subory (per-user, per-server) |

---

## Prispievanie

Pozri [CONTRIBUTING.md](CONTRIBUTING.md) pre navod na setup, branche a commit konvencie.

---

## Licencia

Distribuovane pod ISC licenciou.

---

<div align="center">

**Vytvorili [Kybertop](https://github.com/Kybertop) & [Skorocel](https://github.com/HenrykGurzsky)**

</div>
