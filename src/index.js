require('dotenv/config');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { handleInteraction } = require('./handlers');
const notifications = require('./notifications');

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error('❌ Chýba DISCORD_TOKEN v .env súbore!');
    console.error('   Skopíruj .env.example → .env a vyplň svoj token.');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

client.once('ready', () => {
    console.log('═══════════════════════════════════════');
    console.log(`  ⛅ Weather Bot online!`);
    console.log(`  📡 Prihlásený ako: ${client.user.tag}`);
    console.log(`  🏠 Servery: ${client.guilds.cache.size}`);
    console.log('═══════════════════════════════════════');

    client.user.setActivity('počasie ⛅ | /pocasie', { type: ActivityType.Watching });

    // Spusti notifikačný systém
    notifications.init(client);
});

client.on('interactionCreate', async (interaction) => {
    try {
        await handleInteraction(interaction);
    } catch (err) {
        console.error('[ERROR] Neošetrená chyba:', err);
        const reply = { content: '❌ Niečo sa pokazilo. Skús to znova.', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(reply).catch(() => {});
        } else {
            await interaction.reply(reply).catch(() => {});
        }
    }
});

client.login(TOKEN);
