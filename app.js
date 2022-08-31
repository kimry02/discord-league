require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences], partials: [Partials.Message] });
const axios = require('axios').default;
const backtick = "```";

client.once('ready', () => {
    console.log('Bot is ready!');
})

client.on('interactionCreate', async interaction => {

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
            const [PUUID, iconID] = await getPUUID(summID);
            if(PUUID === null) {
                throw error;
            }
            const matchID = await getMID(PUUID);
            const res = await getMatch(matchID[0], PUUID);
            const arr = summID.split(' ');
            let urlSummID = summID;
            if(arr.length > 1) {
                urlSummID = arr.join("%20");
            }
            if(res.won) {
                const winEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`Recent Ranked Game`)
                .setURL(`https://na.op.gg/summoners/na/${urlSummID}/`)
                .setAuthor({ name: `${summID}`, iconURL: `https://ddragon.leagueoflegends.com/cdn/12.16.1/img/profileicon/${iconID}.png` })
                .setDescription('Click to follow OP.GG link')
                .setThumbnail(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${res.champid}.png`)
                .addFields(
                    { name: 'VICTORY', value: `${res.k}/${res.d}/${res.a}` },
                    { name: 'CS', value: res.minionKill },
                    { name: 'Duration', value: `${minutes}:${seconds}`}
                );            
                message.reply({ embeds: [winEmbed] });
            } else {
                const minutes = Math.floor((res.matchDuration) / 60);
                const seconds = ((res.matchDuration) - (minutes * 60));
                const lossEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`Recent Ranked Game`)
                .setURL(`https://na.op.gg/summoners/na/${urlSummID}/`)
                .setAuthor({ name: `${summID}`, iconURL: `https://ddragon.leagueoflegends.com/cdn/12.16.1/img/profileicon/${iconID}.png` })
                .setDescription('Click to follow OP.GG link')
                .setThumbnail(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${res.champid}.png`)
                .addFields(
                    { name: 'DEFEAT', value: `${res.k}/${res.d}/${res.a}`, inline: true },
                    { name: 'CS', value: `${res.minionKill}`, inline: true },
                    { name: 'Duration', value: `${minutes}:${seconds >= 10 ? seconds : '0' + seconds}`, inline: true}
                );
            
                message.reply({ embeds: [lossEmbed] });
            }
        } catch (error) {
            console.log(error);
            message.reply(`${backtick}Summoner ${summID} not found...${backtick}`);
        }
    }
})

async function getPUUID(summonerString) {
    try {
        const res = await axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerString}?api_key=${process.env.RG_TOKEN}`);
        return [res.data.puuid, res.data.profileIconId];
    } catch (error) {
        return null;
    }
}

async function getMID(summonerPUUID) {
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
                champ: summoner.championName,
                won: summoner.win,
                champid: summoner.championId,
                minionKill: summoner.totalMinionsKilled,
                matchDuration: response.data.info.gameDuration
            };
            return responseData;
        }).catch(function (error) {
            console.error(error);
            console.log("errorrrrr");
            return null;
        })
}

client.login(process.env.BOT_TOKEN);