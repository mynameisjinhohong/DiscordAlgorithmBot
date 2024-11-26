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
const KST_OFFSET = 9 * 60 * 60 * 1000;
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
    console.log(`KST_OFFSET: ${KST_OFFSET}`);

    schedule.scheduleJob('0 0 15 * * 0', async () => { // UTC 기준 일요일 오후 3시 실행
        const now = new Date();
        // 한국 시간으로 변환된 현재 시간
        const nowKST = new Date(now.getTime() + KST_OFFSET);

        // 한국 시간 기준 자정으로 계산된 1주일 전
        const oneWeekAgoKST = new Date(
            nowKST.getFullYear(),
            nowKST.getMonth(),
            nowKST.getDate() - 7, // 7일 전
            0, 0, 0, 0 // 자정
        );

        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);
        const algorithmChannel = guild.channels.cache.get(algorithmChannelId);

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

            // UTC 메시지 타임스탬프를 KST로 변환 후 비교
            if (messages.some(message => message.createdTimestamp + KST_OFFSET <= oneWeekAgoKST.getTime())) {
                break;
            }
        }

        // UTC 메시지 타임스탬프를 KST로 변환 후 필터링
        const oneWeekMessages = fetchedMessages.filter(
            message => message.createdTimestamp + KST_OFFSET > oneWeekAgoKST.getTime()
        );
        const activeMembers = new Set(oneWeekMessages.map(message => message.author.id));

        const penaltyMessages = members
            .filter(memberId => !activeMembers.has(memberId))
            .map(memberId => {
                if (!fines[memberId]) {
                    fines[memberId] = 0;
                }
                fines[memberId] += 1000;
                return `<@${memberId}> 1000원 벌금,3333-24-3711302 입금하시면 됩니다.`;
            });

        saveFines(fines);
        if (penaltyMessages.length > 0) {
            generalChannel.send(penaltyMessages.join('\n'));
        } else {
            generalChannel.send('이번주는 다들 문제를 풀었습니다. 다들 수고하셨습니다');
        }
    });
});

client.on('messageCreate', async message => {
    if (message.content === '!test' && (message.author.id == '382878217972744193' || message.author.id == '993493682810527814')) {
        const now = new Date();
        // 한국 시간으로 변환된 현재 시간
        const nowKST = new Date(now.getTime() + KST_OFFSET);

        // 한국 시간 기준 자정으로 계산된 1주일 전
        const oneWeekAgoKST = new Date(
            nowKST.getFullYear(),
            nowKST.getMonth(),
            nowKST.getDate() - 7, // 7일 전
            0, 0, 0, 0 // 자정
        );

        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);
        const algorithmChannel = guild.channels.cache.get(algorithmChannelId);

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
            console.log(fetchedMessages.createdTimestamp + KST_OFFSET)
            lastMessageId = messages.last().id;

            // UTC 메시지 타임스탬프를 KST로 변환 후 비교
            if (messages.some(message => message.createdTimestamp + KST_OFFSET <= oneWeekAgoKST.getTime())) {
                break;
            }
        }

        // UTC 메시지 타임스탬프를 KST로 변환 후 필터링
        const oneWeekMessages = fetchedMessages.filter(
            message => message.createdTimestamp + KST_OFFSET > oneWeekAgoKST.getTime()
        );
        const activeMembers = new Set(oneWeekMessages.map(message => message.author.id));
        

        const penaltyMessages = members
            .filter(memberId => !activeMembers.has(memberId))
            .map(memberId => {
                if (!fines[memberId]) {
                    fines[memberId] = 0;
                }
                fines[memberId] += 1000;
                return `<@${memberId}> 1000원 벌금,3333-24-3711302 입금하시면 됩니다.`;
            });

        saveFines(fines);
        if (penaltyMessages.length > 0) {
            generalChannel.send(penaltyMessages.join('\n'));
        } else {
            generalChannel.send('이번주는 다들 문제를 풀었습니다. 다들 수고하셨습니다');
        }
    }
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
            console.log(fines);
        generalChannel.send(allFinesMessages);
    }
    if (message.content.indexOf('!정상화') === 0 && (message.author.id == '382878217972744193' || message.author.id == '993493682810527814')) {
        // 멘션된 사용자의 ID 추출
        const targetId = message.mentions.users.first()?.id;
        const guild = client.guilds.cache.first();
        const generalChannel = guild.channels.cache.get(generalChannelId);
        if (targetId) {
            const allFinesMessages = members
                .map(memberId => {
                    if (!fines[memberId]) {
                        fines[memberId] = 0;
                    }
                    if (targetId === memberId) {
                        fines[memberId] = 0;  // 벌금 초기화
                    }
                    return `<@${memberId}> 현재 벌금: ${fines[memberId]}원`;
                })
                .join('\n');
    
            console.log(message.content);
            console.log(targetId);
            generalChannel.send(allFinesMessages);
            saveFines(fines);
        }
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
