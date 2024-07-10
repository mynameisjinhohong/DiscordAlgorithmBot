// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, algorithmChannelId, generalChannelId, members } = require('./config.json');
const schedule = require('node-schedule'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // MESSAGE_CONTENT 인텐트를 추가합니다.
    ]
});

client.once('ready', () => {
    console.log('Ready!');

    // Schedule the task for every Sunday at midnight
    schedule.scheduleJob('0 0 * * 0', async () => {
        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);
        const algorithmChannel = guild.channels.cache.get(algorithmChannelId);

        // 현재 시간과 1주일 전 시간 계산
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        // 알고리즘 채널의 메시지를 페치하고 1주일 이내의 메시지를 확인
        let fetchedMessages = [];
        let lastMessageId;
        while (true) {
            const options = { limit: 100 };
            if (lastMessageId) {
                options.before = lastMessageId;
            }

            const messages = await algorithmChannel.messages.fetch(options);
            if (messages.size === 0) {
                break;
            }

            fetchedMessages = fetchedMessages.concat(Array.from(messages.values()));
            lastMessageId = messages.last().id;

            // 메시지가 1주일 이전의 것인지 확인
            if (messages.some(message => message.createdTimestamp <= oneWeekAgo.getTime())) {
                break;
            }
        }

        // 1주일 이내의 메시지로 필터링
        const oneWeekMessages = fetchedMessages.filter(message => message.createdTimestamp > oneWeekAgo.getTime());
        const activeMembers = new Set(oneWeekMessages.map(message => message.author.id));

        members.forEach(memberId => {
            if (!activeMembers.has(memberId)) {
                const member = guild.members.cache.get(memberId);
                generalChannel.send(`<@${memberId}> 1000원 벌금`);
            }
        });
    });
});
client.on('messageCreate', async message => {
    if (message.channel.id === algorithmChannelId) {
        algorithmMessages.add(message.author.id);
    }
    if (message.content === '!test') {
        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);
        const algorithmChannel = guild.channels.cache.get(algorithmChannelId);

        // 현재 시간과 1주일 전 시간 계산
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        // 알고리즘 채널의 메시지를 페치하고 1주일 이내의 메시지를 확인
        let fetchedMessages = [];
        let lastMessageId;
        while (true) {
            const options = { limit: 100 };
            if (lastMessageId) {
                options.before = lastMessageId;
            }

            const messages = await algorithmChannel.messages.fetch(options);
            if (messages.size === 0) {
                break;
            }

            fetchedMessages = fetchedMessages.concat(Array.from(messages.values()));
            lastMessageId = messages.last().id;

            // 메시지가 1주일 이전의 것인지 확인
            if (messages.some(message => message.createdTimestamp <= oneWeekAgo.getTime())) {
                break;
            }
        }

        // 1주일 이내의 메시지로 필터링
        const oneWeekMessages = fetchedMessages.filter(message => message.createdTimestamp > oneWeekAgo.getTime());
        const activeMembers = new Set(oneWeekMessages.map(message => message.author.id));

        members.forEach(memberId => {
            if (!activeMembers.has(memberId)) {
                const member = guild.members.cache.get(memberId);
                generalChannel.send(`<@${memberId}> 1000원 벌금`);
            }
        });
    }
});

client.on('error', error => {
    console.error('The websocket connection encountered an error:', error);
});

// Log in to Discord with your client's token
client.login(token);
