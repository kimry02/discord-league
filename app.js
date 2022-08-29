require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences], partials: [Partials.Message] });
const axios = require('axios').default;

client.once('ready', () => {
    console.log('Bot is ready!');
})

client.on('interactionCreate', async interaction => {
    console.log(interaction);

    if(!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    if(commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if(commandName === 'grant') {
        await interaction.reply('is silver');
    }
})

client.on('messageCreate', async message => {
    if(!message.content.startsWith("!") || message.author.bot) return;
    var args = message.content.slice(1).split(" ");
    if(args[0] === 'recent') {
        args.shift();
        var summID;
        if(args.length > 1) {
            summID = args.join(' ');
        } else {
            summID = args[0];
        }
        try {
            const PUUID = await getPUUID(summID);
            if(PUUID === null) {
                throw error;
            }
            const matchID = await getLoss(PUUID);
            const res = await getMatch(matchID[0], PUUID);
            message.reply(`${summID} went ${res.k}/${res.d}/${res.a} on ${res.champ}.`);
        } catch (error) {
            message.reply(`Summoner ${summID} not found...`);
        }
    }
})

async function getPUUID(summonerString) {
    try {
        const res = await axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerString}?api_key=${process.env.RG_TOKEN}`);
        return res.data.puuid;
    } catch (error) {
        return null;
    }
}

async function getLoss(summonerPUUID) {
    return await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerPUUID}/ids`, {
        params: {
            type: 'ranked',
            start: '0',
            count: '1',
            api_key: process.env.RG_TOKEN,
        }
    }).then(function (response) {
        return response.data;
    })
    .catch(function (error) {
        console.error(error);
    });
}

async function getMatch(matchID, summonerPUUID) {
    return await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchID}`, {
            params: {
                api_key: process.env.RG_TOKEN,
            }
        }).then(function (response) {
            const participantsList = response.data.info.participants;
            var summoner = null;
            var summonerNum = 0;
            for(var i = 0; i < participantsList.length; i++) {
                if(participantsList[i].puuid === summonerPUUID) {
                    summoner = participantsList[i];
                    summonerNum = i;
                }
            }
            const summonerRole = summoner.role;
            var enemySummoner = null;
            for(var i = 0; i < participantsList.length; i++) {
                if(summonerNum === i) continue;
                if(summonerRole === participantsList[i].summonerRole) {
                    enemySummoner = participantsList[i];
                }
            }
            
            var responseData = {
                k: summoner.kills,
                d: summoner.deaths,
                a: summoner.assists,
                champ: summoner.championName
            };
            return responseData;
        }).catch(function (error) {
            console.error(error);
            console.log("errorrrrr");
            return null;
        })
}

client.login(process.env.BOT_TOKEN);