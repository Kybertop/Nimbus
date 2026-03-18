require('dotenv/config');
const { REST, Routes } = require('discord.js');
const commands = require('./commands');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('Chýba DISCORD_TOKEN alebo CLIENT_ID v .env súbore!');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Registrujem ${commands.length} slash commandov...`);
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Slash commandy úspešne zaregistrované!');
    } catch (err) {
        console.error('❌ Chyba pri registrácii:', err);
    }
})();
