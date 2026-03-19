const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } = require('discord.js');

// Everywhere = guild + bot DM + private DM (user-installed)
const EVERYWHERE = {
    integrationTypes: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
    contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
};

// Guild only = len na serveroch kde je bot nainštalovaný
const GUILD_ONLY = {
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    contexts: [InteractionContextType.Guild],
};

function everywhere(builder) {
    return builder
        .setIntegrationTypes(...EVERYWHERE.integrationTypes)
        .setContexts(...EVERYWHERE.contexts);
}

function guildOnly(builder) {
    return builder
        .setIntegrationTypes(...GUILD_ONLY.integrationTypes)
        .setContexts(...GUILD_ONLY.contexts);
}

const commands = [
    // ── Fungujú všade (server, bot DM, cudzie DMs) ──
    everywhere(new SlashCommandBuilder()
        .setName('pocasie')
        .setDescription('Zobrazí počasie pre tvoju lokalitu')
        .addStringOption(opt => opt.setName('mesto').setDescription('Jednorazovo iné mesto'))
        .addStringOption(opt => opt.setName('mesto2').setDescription('Druhé mesto na porovnanie'))
        .addIntegerOption(opt => opt.setName('o').setDescription('Predpoved na konkretnu hodinu (0-23)').setMinValue(0).setMaxValue(23))),

    everywhere(new SlashCommandBuilder()
        .setName('vzduch')
        .setDescription('Kvalita vzduchu (AQI, PM2.5, PM10, NO₂, O₃)')
        .addStringOption(opt => opt.setName('mesto').setDescription('Iné mesto'))),

    everywhere(new SlashCommandBuilder()
        .setName('radar')
        .setDescription('Odkaz na radar zrážok pre tvoju oblasť')),

    everywhere(new SlashCommandBuilder()
        .setName('oblubene')
        .setDescription('Správa obľúbených miest')),

    everywhere(new SlashCommandBuilder()
        .setName('nastavenia')
        .setDescription('Nastavenie lokality, preferencií a notifikácií')),

    everywhere(new SlashCommandBuilder()
        .setName('notifikacie')
        .setDescription('Zobrazí a spravuje tvoje notifikácie')),

    everywhere(new SlashCommandBuilder()
        .setName('help')
        .setDescription('Prehľad všetkých funkcií bota')),

    everywhere(new SlashCommandBuilder()
        .setName('mesiac')
        .setDescription('Lunárny kalendár — fázy mesiaca na 14 dní')),

    everywhere(new SlashCommandBuilder()
        .setName('outfit')
        .setDescription('Čo si obliecť dnes podľa počasia')
        .addStringOption(opt => opt.setName('mesto').setDescription('Iné mesto'))),

    everywhere(new SlashCommandBuilder()
        .setName('doprava')
        .setDescription('Dopravné varovania — námraza, hmla, vietor, dážď')),

    // ── Len na serveroch (potrebujú guild funkcie) ──
    // ── Poll — funguje aj v DMs ──
    everywhere(new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Hlasovanie "Pôjdeme von?" — vyber deň/dni z predpovede')),

    guildOnly(new SlashCommandBuilder()
        .setName('kanal')
        .setDescription('Nastav kanál pre automatické ranné počasie (admin)')
        .addStringOption(opt => opt.setName('mesto').setDescription('Mesto pre server počasie').setRequired(true))
        .addIntegerOption(opt => opt.setName('hodina').setDescription('Hodina odoslania (0-23, default 7)').setMinValue(0).setMaxValue(23))
        .addChannelOption(opt => opt.setName('channel').setDescription('Kanál (default: tento)'))),
];

module.exports = commands.map(c => c.toJSON());
