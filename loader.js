const request = require('request-promise');
const mongo = require('mongodb');
const apiUrl = 'https://poloniex.com/public?';

const from = +new Date('06.01.2017') / 1000;
const to = +new Date('06.25.2017') / 1000;

const period = 60 * 30;
const prefix = '30m_';

async function calc() {
    const db = await mongo.MongoClient.connect('mongodb://localhost:27017/calculator');

    for (let pair of [
        //'BTC_AMP',
        /*'BTC_ARDR',
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
        'BTC_ZEC',*/
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
    ]) {
        console.log(pair);

        const result = JSON.parse(await request(
            `${apiUrl}command=returnChartData&currencyPair=${pair}&start=${from}&end=${to}&period=${period}`
        ));

        //try {await db.collection(prefix + pair).drop();} catch (e) {}
        await db.collection(prefix + pair).insertMany(result);
    }
}

calc().then(() => {
    process.nextTick(() => {
        process.exit(0)
    });
});