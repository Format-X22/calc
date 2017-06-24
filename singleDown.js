const mongo = require('mongodb');

const pairs = [
    ['BTC_AMP', 0.98],
    ['BTC_ARDR', 0.98],
    //'BTC_BCN',
    ['BTC_BCY', 0.96],
    ['BTC_BELA', 0.97],
    ['BTC_BLK', 0.97],
    ['BTC_BTCD', 0.96],
    ['BTC_BTM', 0.96],
    ['BTC_BTS', 0.99],
    ['BTC_BURST', 0.98],
        ['BTC_CLAM', 0.99],
        ['BTC_DASH', 0.99],
        ['BTC_DCR', 0.99],
        ['BTC_DGB', 0.99],
    //'BTC_DOGE',
        ['BTC_EMC2', 0.98],
        ['BTC_ETC', 0.99],
        ['BTC_ETH', 0.99],
        ['BTC_EXP', 0.98],
        ['BTC_FCT', 0.98],
        ['BTC_FLDC', 0.97],
        ['BTC_FLO', 0.98], // TODO
        ['BTC_GAME', 0.98],
        ['BTC_GNO', 0.98],
        ['BTC_GNT', 0.98],
        ['BTC_GRC', 0.98],
        ['BTC_HUC', 0.98],
        ['BTC_LBC', 0.98],
        ['BTC_LSK', 0.98],
        ['BTC_LTC', 0.98],
        ['BTC_MAID', 0.98],
        ['BTC_NAUT', 0.98],
        ['BTC_NAV', 0.98],
        ['BTC_NEOS', 0.98],
        ['BTC_NMC', 0.98],
        ['BTC_NOTE', 0.98],
        ['BTC_NXC', 0.98],
        ['BTC_NXT', 0.98],
        ['BTC_OMNI', 0.98],
        ['BTC_PASC', 0.98],
        ['BTC_PINK', 0.98],
        ['BTC_POT', 0.98],
        ['BTC_PPC', 0.98],
        ['BTC_RADS', 0.98],
        ['BTC_REP', 0.98],
        ['BTC_RIC', 0.98],
        ['BTC_SBD', 0.98],
        ['BTC_SC', 0.98],
        ['BTC_SJCX', 0.98],
        ['BTC_STEEM', 0.98],
        ['BTC_STR', 0.98],
        ['BTC_STRAT', 0.98],
        ['BTC_SYS', 0.98],
        ['BTC_VIA', 0.98],
        ['BTC_VRC', 0.98],
        ['BTC_VTC', 0.98],
        ['BTC_XBC', 0.98],
        ['BTC_XCP', 0.98],
        ['BTC_XEM', 0.98],
        ['BTC_XMR', 0.98],
        ['BTC_XPM', 0.98],
        ['BTC_XRP', 0.98],
        ['BTC_XVC', 0.98],
        ['BTC_ZEC', 0.98],
        ['USDT_BTC', 0.98],
        ['USDT_LTC', 0.98],
        ['USDT_ETH', 0.98],
        ['USDT_ETC', 0.98],
        ['USDT_XRP', 0.98],
        ['USDT_ZEC', 0.98],
        ['USDT_NXT', 0.98],
        ['USDT_STR', 0.98],
        ['USDT_DASH', 0.98],
    ['USDT_XMR', 0.98],
    ['USDT_REP', 0.98]
];

const prefixesData = [
    ['',     60 / 5 * 24],
    ['15m_', 60 / 15 * 24],
    ['30m_', 60 / 30 * 24],
    ['2h_',  24 / 2],
    ['4h_',  24 / 4],
    ['1d_',  1]
];

const profitFrom = 0.99;
const profitTo = 0.85;
const backPriceFrom = 1.15;
const backPriceTo = 1.01;
const profitStep = 0.01;
const dateFromRaw = +new Date('03/01/17')/1000;
const skipDays = 30;

async function calc() {
    const db = await mongo.MongoClient.connect('mongodb://localhost:27017/calculator');

    for (let pairData of pairs) {

        const pair = pairData[0];
        const spread = pairData[1];

        for (let prefixData of prefixesData) {
            let prefix = prefixData[0];
            let prefixMinutesMul = prefixData[1];

            const ticks = await db.collection(prefix + pair)
                .find({date: {$gt: dateFromRaw}}, {open: 1, close: 1, high: 1, low: 1, date: 1, _id: 0})
                .skip(skipDays * prefixMinutesMul)
                .toArray();

            const results = [];

            for (
                let profitCoef = profitFrom;
                profitCoef >= profitTo;
                profitCoef = +(profitCoef - profitStep).toFixed(2)
            ) {

                for (
                    let backPriceCoef = backPriceFrom;
                    backPriceCoef >= backPriceTo;
                    backPriceCoef = +(backPriceCoef - profitStep).toFixed(2)
                ) {
                    let profit = 100;
                    let prev = null;
                    let prePrev = null;
                    let profitSum = 0;

                    for (let tick of ticks) {
                        prev = prev || tick;
                        prePrev = prePrev || prev;

                        if (tick !== prev && prev !== prePrev) {

                            const buyPrice = prePrev.open * profitCoef;
                            const sellPrice = buyPrice * backPriceCoef;

                            if (prePrev.low < buyPrice) {

                                let profitRes = 0;

                                if (prePrev.close > sellPrice) {
                                    profitRes = backPriceCoef;
                                } else if (prev.high > sellPrice) {
                                    profitRes = backPriceCoef;
                                } else {
                                    profitRes = 1 + ((tick.open * spread * 100 / buyPrice) - 100) / 100;
                                }

                                profit *= profitRes;
                                profitSum += profitRes - 1;
                            }
                        }

                        prePrev = prev;
                        prev = tick;
                    }

                    //if (profit > 290) {
                        //console.log(`Calc: ${pair} (${prefix || '5m_'}, ${profitCoef}, ${backPriceCoef}) = ${profit.toFixed(2)} (${profitSum})`);
                    //}

                    results.push({prefix: prefix || '5m_', pair, profitCoef, backPriceCoef, profit: profit.toFixed(2), profitSum});
                }
            }

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