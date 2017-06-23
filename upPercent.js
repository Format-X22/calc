const mongo = require('mongodb');

const percentStart = 5;
const percentEnd = 25;
const percentDrop = 15;
let accum_profit = 0;
let total_profit = 0;

const prefix = '';

const pairs = [
    'BTC_AMP',
    'BTC_ARDR',
    'BTC_BCN',
    'BTC_BCY',
    'BTC_BELA',
    'BTC_BLK',
    'BTC_BTCD',
    'BTC_BTM',
    'BTC_BTS',
    'BTC_BURST',
    'BTC_CLAM',
    'BTC_DASH',
    'BTC_DCR',
    'BTC_DGB',
    'BTC_DOGE',
    'BTC_EMC2',
    'BTC_ETC',
    'BTC_ETH',
    'BTC_EXP',
    'BTC_FCT',
    'BTC_FLDC',
    'BTC_FLO',
    'BTC_GAME',
    'BTC_GNO',
    'BTC_GNT',
    'BTC_GRC',
    'BTC_HUC',
    'BTC_LBC',
    'BTC_LSK',
    'BTC_LTC',
    'BTC_MAID',
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
    'BTC_STR',
    'BTC_STRAT',
    'BTC_SYS',
    'BTC_VIA',
    'BTC_VRC',
    'BTC_VTC',
    'BTC_XBC',
    'BTC_XCP',
    'BTC_XEM',
    'BTC_XMR',
    'BTC_XPM',
    'BTC_XRP',
    'BTC_XVC',
    'BTC_ZEC',
    'USDT_BTC',
    'USDT_LTC',
    'USDT_ETH',
    'USDT_ETC'
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
            .find({}, {open: 1, close: 1, high: 1, low: 1, date: 1, _id: 0})
            //.skip((12 * 30 / 5 * 17))
            //.skip(12 * 30)
            .skip(60 * 24 * 30 / 5)
            .toArray();

        for (let tick of ticks) {
            if (!last_last_tick) {
                //console.log(new Date(tick.date * 1000));
            }

            if (stop) {
                //continue;
            }

            last_tick = last_tick || tick;
            last_last_tick = last_last_tick || last_tick;

            switch (state) {
                case 'buy':
                    if (((tick.close * 100 / tick.open) - 100) > percentStart) {
                        buy_price = tick.close;
                        state = 'wait';

                        //console.log(buy_price);
                    }
                    break;
                case 'wait':
                    if (tick.high > buy_price * (1 + percentEnd / 100)) {
                        let percent = percentEnd * 0.9976 * (2 - 1.0024) / 100;

                        profit *= 1 + percent;
                        state = 'buy';

                        tradeCount += percent;

                        //stop = true;
                    } else if (tick.low < buy_price * (1 - percentDrop / 100)) {
                        let percent = percentDrop * 0.9976 * (2 - 1.0024) / 100;

                        profit *= 1 - percent;
                        state = 'buy';

                        tradeCount -= percent;

                        stop = true;
                    }

                    /*if (tick.open > tick.close) {
                        let percent = ((tick.close * 100 / buy_price) - 100) * 0.9976 * (2 - 1.0024);

                        //console.log(1 + percent / 100);

                        profit *= 1 + percent / 100;
                        state = 'buy';

                        tradeCount += percent;

                        stop = true;
                    }*/
                    break;
            }

            last_last_tick = last_tick;
            last_tick = tick;
        }

        console.log(`Calc: ${pair} = ${profit.toFixed(2)}`);

        accum_profit += profit;
    }

    total_profit = (accum_profit / pairs.length) * 0.8;

    //console.log(`Total: ${total_profit.toFixed(2)}`);
    //console.log(`COUNT: ${tradeCount}`);
}

calc().then(() => {
    process.nextTick(() => {
        process.exit(0)
    });
});