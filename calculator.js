const mongo = require('mongodb');

const coef = 1.97;
const calm = 7;
let accum_profit = 0;
let total_profit = 0;

const pairs = [
    'BTC_AMP',
    'BTC_ARDR',
    'BTC_BCN',
    'BTC_BCY',
    'BTC_BELA',
    'BTC_BLK',
    'BTC_BTCD',
    'BTC_BTM',
    //'BTC_BTS',
    'BTC_BURST',
    //'BTC_CLAM',
    //'BTC_DASH',
    'BTC_DCR',
    'BTC_DGB',
    //'BTC_DOGE',
    'BTC_EMC2',
    //'BTC_ETC',
    //'BTC_ETH',
    'BTC_EXP',
    //'BTC_FCT',
    'BTC_FLDC',
    'BTC_FLO',
    'BTC_GAME',
    //'BTC_GNO',
    'BTC_GNT',
    'BTC_GRC',
    'BTC_HUC',
    'BTC_LBC',
    'BTC_LSK',
    //'BTC_LTC',
    //'BTC_MAID',
    'BTC_NAUT',
    'BTC_NAV',
    'BTC_NEOS',
    'BTC_NMC',
    'BTC_NOTE',
    'BTC_NXC',
    'BTC_NXT',
    'BTC_OMNI',
    'BTC_PASC',
    'BTC_PINK',
    'BTC_POT',
    'BTC_PPC',
    'BTC_RADS',
    'BTC_REP',
    'BTC_RIC',
    'BTC_SBD',
    'BTC_SC',
    'BTC_SJCX',
    'BTC_STEEM',
    //'BTC_STR',
    'BTC_STRAT',
    'BTC_SYS',
    'BTC_VIA',
    'BTC_VRC',
    'BTC_VTC',
    'BTC_XBC',
    'BTC_XCP',
    'BTC_XEM',
    //'BTC_XMR',
    'BTC_XPM',
    //'BTC_XRP',
    'BTC_XVC',
    'BTC_ZEC'
];

async function calc() {
    const db = await mongo.MongoClient.connect('mongodb://localhost:27017/calculator');
    const usdt_data_raw = await db.collection('USDT_BTC').find({}, {date: 1, weightedAverage: 1, _id: 0}).toArray();
    const usdt_data = {};

    let firstUsdt = usdt_data_raw[0].weightedAverage;
    let lastUsdt = usdt_data_raw[usdt_data_raw.length - 1].weightedAverage;

    usdt_data_raw.map((tick) => {
        usdt_data[tick.date] = tick.weightedAverage;
    });

    for (let pair of pairs) {
        let profit = 100;
        let state = 'buy';
        let buy_price = null;
        let calm_time = null;
        let max_low = Infinity;
        let usdt_low = Infinity;

        let last_tick = null;

        const ticks = await db.collection(pair)
            .find({}, {date: 1, open: 1, close: 1, low: 1, _id: 0})
            .skip(60 * 24 * 30 / 5)
            .toArray();

        for (let tick of ticks) {
            last_tick = tick;

            const usdt = usdt_data[tick.date];

            if (max_low > tick.low) {
                max_low = tick.low;
                usdt_low = usdt
            }

            switch (state) {
                case 'buy':
                    if (tick.open >= tick.close) {
                        buy_price = tick.close * 1.01;
                        state = 'wait';
                    }
                    break;
                case 'wait':
                    let top = tick.open > tick.close ? tick.open : tick.close;
                    let top_di = top / usdt;
                    let low_di = max_low / usdt_low;
                    let percent = (top * 100 / buy_price) - 100;

                    if (top_di > low_di * coef) {
                        profit *= 1 + percent / 100;
                        calm_time = tick.date + calm * 24 * 60 * 60;
                        state = 'calm';
                    }
                    break;
                case 'calm':
                    if (tick.date >= calm_time) {
                        state = 'buy'
                    }
                    break;
            }
        }

        if (state = 'wait') {
            if (!last_tick) {
                console.log(pair);
            }

            let tick = last_tick;
            let top = tick.open > tick.close ? tick.open : tick.close;
            let percent = (top * 100 / buy_price) - 100;

            profit *= 1 + percent / 100;
        }

        console.log(`Calc: ${pair} = ${profit}`);

        accum_profit += profit;
    }

    total_profit = (accum_profit / pairs.length) * (lastUsdt / firstUsdt) * 0.8;

    console.log(`Total: ${total_profit}`);

    console.log(`BTC grow: ${(lastUsdt * 100 / firstUsdt) - 100}`)
}

calc().then(() => {
    process.nextTick(() => {
        process.exit(0)
    });
});