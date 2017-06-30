const mongo = require('mongodb');

const pairs = [
    'BTC_ARDR',
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
    'USDT_ETC',
    'USDT_XRP',
    'USDT_ZEC',
    'USDT_NXT',
    'USDT_STR',
    'USDT_DASH',
    'USDT_XMR',
    'USDT_REP'
];

const prefixesData = [
    ['',     60 / 5 * 24],
    ['15m_', 60 / 15 * 24],
    ['30m_', 60 / 30 * 24],
    //['2h_',  24 / 2],
    //['4h_',  24 / 4],
    //['1d_',  1]
];

const dateFromRaw = +new Date('05/15/17')/1000;
const skipDays = 30;
const spread = 0.97;

async function calc() {
    const db = await mongo.MongoClient.connect('mongodb://localhost:27017/calculator');

    for (let pair of pairs) {
        for (let prefixData of prefixesData) {
            let prefix = prefixData[0];
            let prefixMinutesMul = prefixData[1];

            const ticks = await db.collection(prefix + pair)
                .find({date: {$gt: dateFromRaw}}, {open: 1, close: 1, high: 1, low: 1, date: 1, _id: 0})
                .skip(skipDays * prefixMinutesMul)
                .toArray();

            const results = [];


                    let profit = 100;
                    let prev = null;
                    let profitSum = 0;

                    for (let tick of ticks) {
                        prev = prev || tick;

                        //
                        
                        prev = tick;
                    }

            results.push({prefix: prefix || '5m_', pair, profit: profit.toFixed(2), profitSum});

            let maxVal = 0;
            let max = null;

            results.forEach((result) => {
                if (+(result.profit) > maxVal) {
                    maxVal = +(result.profit);
                    max = result;
                }
            });

            console.log(`Calc: ${pair} (${prefix || '5m_'}, ${max.profitCoef}, ${max.backPriceCoef}) = ${max.profit} (${max.profitSum})`);

            await db.collection('RESULTS').insertOne(max);
        }
    }

    console.log('DONE');
}

calc().then(() => {
    process.nextTick(() => {
        process.exit(0)
    });
});