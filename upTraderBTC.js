const mongo = require('mongodb');

const coef = 1.97;
const calm = 7;
let accum_profit = 0;
let total_profit = 0;

const prefix = '';

const pairs = [
    'USDT_BTC',
    //'USDT_ETH',
    //'USDT_LTC',
    //'USDT_ETC'
];

async function calc() {
    const db = await mongo.MongoClient.connect('mongodb://localhost:27017/calculator');

    let tradeCount = 0;

    for (let pair of pairs) {
        let profit = 100;
        let state = 'buy';
        let buy_price = null;

        let last_tick = null;
        let last_last_tick = null;

        const ticks = await db.collection(prefix + pair)
            .find({}, {open: 1, close: 1, date: 1, _id: 0})
            //.skip((12 * 30 / 5 * 17))
            .skip(12 * 30)
            .toArray();

        for (let tick of ticks) {
            if (!last_last_tick) {
                //console.log(new Date(tick.date * 1000));
            }

            last_tick = last_tick || tick;
            last_last_tick = last_last_tick || last_tick;

            switch (state) {
                case 'buy':
                    if (tick.open < tick.close) {
                        buy_price = tick.close * 1.0024;
                        state = 'wait';
                    }
                    break;
                case 'wait':
                    if (tick.open < tick.close && ((tick.close - buy_price) < (tick.close / 12))) {
                        let percent = ((tick.close * 100 / buy_price) - 100) * 0.9876;

                        profit *= 1 + percent / 100;
                        state = 'buy';

                        tradeCount += percent;
                    }
                    break;
            }

            last_last_tick = last_tick;
            last_tick = tick;
        }

        console.log(`Calc: ${pair} = ${profit.toFixed(2)}`);

        accum_profit += profit;
    }

    total_profit = (accum_profit / pairs.length) * 0.8;

    console.log(`Total: ${total_profit.toFixed(2)}`);
    console.log(`COUNT: ${tradeCount}`);
}

calc().then(() => {
    process.nextTick(() => {
        process.exit(0)
    });
});