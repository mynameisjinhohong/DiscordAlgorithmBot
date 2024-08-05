// Require the necessary discord.js classes
const fs = require('fs');
const path = require('path');  // 이 부분을 추가합니다.
const { Client, GatewayIntentBits } = require('discord.js');
const schedule = require('node-schedule');
const express = require('express'); // express를 가져옵니다
const app = express(); // express 애플리케이션 생성

const token = process.env.TOKEN;
const algorithmChannelId = process.env.ALGORITHM_CHANNEL_ID;
const generalChannelId = process.env.GENERAL_CHANNEL_ID;
const members = process.env.MEMBERS ? [...new Set(process.env.MEMBERS.split(','))] : []; // 중복 제거

const PORT = process.env.PORT || 8000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
// 벌금을 저장할 Map 객체
const finesFilePath = path.join(__dirname, 'fines.json');
// 파일에서 벌금 데이터를 읽어옵니다.
const loadFines = () => {
    if (fs.existsSync(finesFilePath)) {
        const data = fs.readFileSync(finesFilePath, 'utf8');
        return JSON.parse(data);
    } else {
        const initialFines = {};
        members.forEach(memberId => initialFines[memberId] = 0);
        return initialFines;
    }
};
// 벌금 데이터를 파일에 저장합니다.
const saveFines = (fines) => {
    fs.writeFileSync(finesFilePath, JSON.stringify(fines, null, 2));
};

// 초기화할 때 벌금 데이터를 로드합니다.
let fines = loadFines();

client.once('ready', () => {
    console.log('Ready!');
    members.forEach(memberId => fines[memberId] = 0);
    schedule.scheduleJob('0 0 15 * * 0', async () => { 
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

        // 벌금 메시지 리스트 생성
        const penaltyMessages = members
        .filter(memberId => !activeMembers.has(memberId))
        .map(memberId => {
            if (!fines[memberId]) {
                fines[memberId] = 0;
            }
            fines[memberId] += 1000; // 벌금 추가
            return `<@${memberId}> 1000원 벌금,3333-24-3711302 입금하시면 됩니다.`;
        });
        saveFines(fines);
        // 벌금 메시지 한번에 보내기
        if (penaltyMessages.length > 0) {
            generalChannel.send(penaltyMessages.join('\n'));
        }
        else{
            generalChannel.send('이번주는 다들 문제를 풀었습니다. 다들 수고하셨습니다');
        }
    });
});

client.on('messageCreate', async message => {
    /*
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
        
        // 벌금 메시지 리스트 생성
        const penaltyMessages = members
        .filter(memberId => !activeMembers.has(memberId))
        .map(memberId => {
            if (!fines[memberId]) {
                fines[memberId] = 0;
            }
            fines[memberId] += 1000; // 벌금 추가
            return `<@${memberId}> 1000원 벌금`;
        });

        // 벌금 메시지 한번에 보내기
        if (penaltyMessages.length > 0) {
            generalChannel.send(penaltyMessages.join('\n'));
        }
    }
    */
    if (message.content === '!All') {
        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);

        // 모든 멤버의 벌금을 출력
        const allFinesMessages = members
            .map(memberId => {
                if (!fines[memberId]) {
                    fines[memberId] = 0;
                }
                return `<@${memberId}> 현재 벌금: ${fines[memberId]}원`;
            })
            .join('\n');

        generalChannel.send(allFinesMessages);
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
