require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Message] });

client.once('ready', () => {
    console.log('Bot is ready!');
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    if(commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if(commandName === 'grant') {
        await interaction.reply('sucks');
    } 
})

client.login(process.env.BOT_TOKEN);