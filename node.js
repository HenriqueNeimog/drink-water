import dotenv from 'dotenv';
import axios from 'axios'
import cron from 'node-cron';
dotenv.config();

const HOST_EVOLUTION = process.env.HOST_EVOLUTION || (() => {
    throw new Error('HOST_EVOLUTION is not defined');
})();
const INSTANCE_EVOLUTION = process.env.INSTANCE_EVOLUTION || (() => {
    throw new Error('INSTANCE_EVOLUTION is not defined');
})();
const API_KEY_EVOLUTION = process.env.API_KEY_EVOLUTION || (() => {
    throw new Error('API_KEY_EVOLUTION is not defined');
})();

const NUMBERS = process.env.NUMBERS ? process.env.NUMBERS.split(',') : (() => {
    throw new Error('NUMBERS is not defined');
})();

const INTERVAL_MINUTES = process.env.INTERVAL_MINUTES ? parseInt(process.env.INTERVAL_MINUTES) : 60;
const RETRY_ATTEMPTS = process.env.RETRY_ATTEMPTS ? parseInt(process.env.RETRY_ATTEMPTS) : 3;

const WATER_QUANTITY_ML = process.env.WATER_QUANTITY_ML ? parseInt(process.env.WATER_QUANTITY_ML) : 200;

const INITIAL_HOUR = process.env.INITIAL_HOUR ? parseInt(process.env.INITIAL_HOUR) : 8;
const FINAL_HOUR = process.env.FINAL_HOUR ? parseInt(process.env.FINAL_HOUR) : 20;

const TIMEZONE = process.env.TZ || 'America/Sao_Paulo';
process.env.TZ = TIMEZONE;

const messages = [
    "⏰ Hora de se hidratar! Beba pelo menos {ML}ml de água agora.",
    "💧 Seu corpo precisa de água! Que tal consumir {ML}ml neste momento?",
    "🚰 Lembrete importante: está na hora de beber {ML}ml de água para manter-se hidratado!",
    "🌊 Pausa para hidratação! Seu organismo está pedindo {ML}ml de água.",
    "⚡ Energia baixa? Beba {ML}ml de água e sinta a diferença!",
    "🎯 Meta de hidratação: consuma {ML}ml de água agora mesmo!",
    "🔔 Ding! Hora do seu shot de hidratação com {ML}ml de água fresquinha.",
    "💪 Cuide da sua saúde! Tome {ML}ml de água para manter o corpo funcionando perfeitamente.",
    "🌟 Brilhe como um diamante! Beba {ML}ml de água e mantenha-se radiante.",
    "⏳ O tempo passou voando! Não esqueça de tomar seus {ML}ml de água agora."
];

const intervals = [];
for (let minute = INITIAL_HOUR * 60; minute <= FINAL_HOUR * 60; minute += INTERVAL_MINUTES) {
    intervals.push(minute);
}
console.log(API_KEY_EVOLUTION)

const api = axios.create({
    baseURL: `${HOST_EVOLUTION}`,
    headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY_EVOLUTION
    }
});

const sendMessages = async (message) => {
    for (const number of NUMBERS) {
        let attempts = 0;
        let sent = false;
        while (attempts < RETRY_ATTEMPTS && !sent) {
            try {
                await api.post(`/message/sendText/${INSTANCE_EVOLUTION}`, {
                    number: number,
                    text: message,
                    delay: 1000
                });
                sent = true;
            } catch (error) {
                attempts++;
                console.error(`Error sending message to ${number}:`, error.response.data);
            }
        }
    }
};

async function verifyAlert() {
    const now = new Date();
    const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes();
    console.log(`Current minute of day: ${currentMinuteOfDay}`);

    const i = intervals.indexOf(currentMinuteOfDay);
    const l = intervals.length;
    
    if (i !== -1) {
        const randomIndex = Math.floor(Math.random() * messages.length);
        let message = messages[randomIndex].replace('{ML}', WATER_QUANTITY_ML.toString());

        const mark = {
            drinkcked: (i+1)*WATER_QUANTITY_ML,
            markDrink: l*WATER_QUANTITY_ML,
            quantity: i+1,
            markQuantity: l
        }
        message += `\n\nVocê já bebeu ${mark.drinkcked/1000}L de ${mark.markDrink/1000}L hoje. (${mark.quantity}/${mark.markQuantity})`;
        sendMessages(message);
    }
    
}

verifyAlert();

cron.schedule('* * * * *', async () => {
    await verifyAlert();
});
