// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require('discord.js');
const schedule = require('node-schedule');
const express = require('express'); // express를 가져옵니다
const app = express(); // express 애플리케이션 생성

const token = process.env.TOKEN;
const algorithmChannelId = process.env.ALGORITHM_CHANNEL_ID;
const generalChannelId = process.env.GENERAL_CHANNEL_ID;
const members = process.env.MEMBERS ? process.env.MEMBERS.split(',') : [];

const PORT = process.env.PORT || 8000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log('Ready!');

    // Schedule the task for every Sunday at midnight
    schedule.scheduleJob('00 15 * * 0', async () => {
        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);
        const algorithmChannel = guild.channels.cache.get(algorithmChannelId);

        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

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

            if (messages.some(message => message.createdTimestamp <= oneWeekAgo.getTime())) {
                break;
            }
        }

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
        // 메시지 작성자 ID를 저장
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
        console.log(members)
        members.forEach(memberId => {
            if (!activeMembers.has(memberId)) {
                generalChannel.send(`<@${memberId}> 1000원 벌금`);
            }
        });
    }
});

client.login(token);

// 간단한 웹 서버 설정
app.get('/', (req, res) => {
    res.send('Bot is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});