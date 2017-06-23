const mongo = require('mongodb');

const xcoef = 0.92;
let accum_profit = 0;
let total_profit = 0;

const prefix = '';

const pairs = [
    //'BTC_AMP',
    //'BTC_ARDR',
    //'BTC_BCN',
    //'BTC_BCY',
    //'BTC_BELA',
    //'BTC_BLK',
    //'BTC_BTCD',
    //'BTC_BTM',
    //'BTC_BTS',
    //'BTC_BURST',
    //'BTC_CLAM',
    //'BTC_DASH',
    //'BTC_DCR',
    //'BTC_DGB',
    //'BTC_DOGE',
    //'BTC_EMC2',
    //'BTC_ETC',
    //'BTC_ETH',
    //'BTC_EXP',
    //'BTC_FCT',
    //'BTC_FLDC',
    //'BTC_FLO',
    //'BTC_GAME',
    //'BTC_GNO',
    //'BTC_GNT',
    //'BTC_GRC',
    //'BTC_HUC',
    //'BTC_LBC',
    //'BTC_LSK',
    //'BTC_LTC',
    //'BTC_MAID',
    //'BTC_NAUT',
    //'BTC_NAV',
    //'BTC_NEOS',
    //'BTC_NMC',
    //'BTC_NOTE',
    //'BTC_NXC',
    //'BTC_NXT',
    //'BTC_OMNI',
    //'BTC_PASC',
    //'BTC_PINK',
    //'BTC_POT',
    //'BTC_PPC',
    //'BTC_RADS',
    //'BTC_REP',
    //'BTC_RIC',
    //'BTC_SBD',
    //'BTC_SC',
    'BTC_SJCX',
    //'BTC_STEEM',
    //'BTC_STR',
    //'BTC_STRAT',
    //'BTC_SYS',
    //'BTC_VIA',
    //'BTC_VRC',
    //'BTC_VTC',
    //'BTC_XBC',
    //'BTC_XCP',
    //'BTC_XEM',
    //'BTC_XMR',
    //'BTC_XPM',
    //'BTC_XRP',
    //'BTC_XVC',
    //'BTC_ZEC',
    //'USDT_BTC',
    //'USDT_LTC',
    //'USDT_ETH',
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

        let stop = false;

        const ticks = await db.collection(prefix + pair)
            .find({date: {$gt: 1483218000}}, {open: 1, close: 1, high: 1, low: 1, date: 1, _id: 0})
            //.skip((12 * 30 / 5 * 17))
            //.skip(12 * 30)
            //.skip(60 * 24 * 30 / 5)
            .toArray();

        for (let tick of ticks) {
            if (!last_last_tick) {
                //console.log(new Date(tick.date * 1000));
            }

            if (stop) {
                continue;
            }

            last_tick = last_tick || tick;
            last_last_tick = last_last_tick || last_tick;

            if (tick !== last_tick && last_last_tick !== last_tick) {

                if (last_tick.low < last_last_tick.open * xcoef || last_last_tick.low < last_last_tick.open * xcoef) {
                    //console.log((last_last_tick.close * 0.95).toFixed(8), tick.open.toFixed(8));

                    profit *= 1 + ((tick.open * 0.97 * 100 / (last_last_tick.close * xcoef)) - 100) / 100;

                    //if (tick.open < tick.high) {
                    //    profit *= 1 + ((tick.open * 100 / (last_last_tick.close * 0.96)) - 100) / 100;
                    //} else {
                    //    profit *= 1 + ((tick.open * 0.98 * 100 / (last_last_tick.close * 0.96)) - 100) / 100;
                    //}

                    //stop = true;

                    //if (tick.high >= last_last_tick.close * (1 - ((1 - xcoef) / 1))) {
                    //if (last_tick.close >= last_last_tick.open * xcoef2) {
                    //    profit *= 1 + (xcoef2 - xcoef);
                    //} else {
                    //    profit *= 1 + ((tick.open * 0.99 * 100 / (last_last_tick.close * xcoef)) - 100) / 100;
                    //}

                    tradeCount++;
                }

            }

            last_last_tick = last_tick;
            last_tick = tick;
        }

        console.log(`Calc: ${pair} = ${profit.toFixed(2)}`);

        accum_profit += profit;
    }

    total_profit = (accum_profit / pairs.length) * 0.8;

    //console.log(`Total: ${total_profit.toFixed(2)}`);
    console.log(`COUNT: ${tradeCount}`);
}

calc().then(() => {
    process.nextTick(() => {
        process.exit(0)
    });
});