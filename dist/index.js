"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import all dependencies, mostly using destructuring for better view.
const bot_sdk_1 = require("@line/bot-sdk");
const express_1 = __importDefault(require("express"));
const request = require('request');
// Setup all LINE client and Express configurations.
const clientConfig = {
    channelAccessToken: `csVTWHw2sveQzUMBSTuhbsjGTJN5tqHYwFDYXM6i5jr7ETBpmdi4H8JqJsx2bh4pVBYX9x+Dw5NL9joswgviRCoV7o6EIkL4DSxTpcAUBCGU+BK9VIHPXSmY1vqWMepsReHaExnTi97VDLwK9ds66gdB04t89/1O/w1cDnyilFU=` || '',
    channelSecret: `c87e18d98e242f44423ba085bd6b0060`,
};
const middlewareConfig = {
    channelAccessToken: `csVTWHw2sveQzUMBSTuhbsjGTJN5tqHYwFDYXM6i5jr7ETBpmdi4H8JqJsx2bh4pVBYX9x+Dw5NL9joswgviRCoV7o6EIkL4DSxTpcAUBCGU+BK9VIHPXSmY1vqWMepsReHaExnTi97VDLwK9ds66gdB04t89/1O/w1cDnyilFU=`,
    channelSecret: `c87e18d98e242f44423ba085bd6b0060` || '',
};
const PORT = process.env.PORT || 8080;
// Create a new LINE SDK client.
const client = new bot_sdk_1.Client(clientConfig);
// Create a new Express application.
const app = express_1.default();
// Function handler to receive the text.
const textEventHandler = async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }
    const { replyToken } = event;
    const { text } = event.message;
    request('http://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_dat', async function (error, response) {
        var _a;
        const body = JSON.parse(response === null || response === void 0 ? void 0 : response.body);
        const data = body === null || body === void 0 ? void 0 : body.data;
        const stock = (_a = data === null || data === void 0 ? void 0 : data.find) === null || _a === void 0 ? void 0 : _a.call(data, stocks => (stocks === null || stocks === void 0 ? void 0 : stocks[0]) === text);
        if (!stock)
            return;
        let info = `證券代號: ${stock[0]}\n證券名稱: ${stock[1]}\n成交金額: ${stock[3]}\n漲跌價差: ${stock[8]}\n`;
        const url = `https://invest.cnyes.com/twstock/tws/${text}`;
        request(url, async function (error, response) {
            // const body = JSON.parse(response?.body)
            const data = await generateBaseInfo(response === null || response === void 0 ? void 0 : response.body);
            if (!data) {
                client.replyMessage(replyToken, { type: 'text', text: `查詢失敗` });
                return;
            }
            const finalString = info.concat(data);
            await client.replyMessage(replyToken, { type: 'text', text: finalString });
        });
    });
    // Reply to the user.
};
const generateBaseInfo = (body) => {
    var _a, _b;
    const baseInfo_rules = new RegExp(`<div class="jsx-838437900 profile-data"><div class="jsx-2687283247 jsx-1763002358 data-block data-block--wider"><div class="jsx-2687283247 jsx-1763002358 block-title">成交張數<\/div>.*市值 .*<\/div><div class="jsx-2687283247 jsx-1763002358 block-value block-value--">.*<\/div><\/div><\/div>`, 'g');
    const baseInfo_div = body.match(baseInfo_rules);
    const title_rules = new RegExp(`<div class="jsx-2687283247 jsx-1763002358 block-title">[\u4e00-\u9fa50-9]*<\/div>`, 'g');
    const title_rules_list = (_a = baseInfo_div === null || baseInfo_div === void 0 ? void 0 : baseInfo_div[0]) === null || _a === void 0 ? void 0 : _a.match(title_rules);
    const title_list = [];
    title_rules_list === null || title_rules_list === void 0 ? void 0 : title_rules_list.forEach(title => {
        var _a, _b, _c;
        const rules1 = `<div class="jsx-2687283247 jsx-1763002358 block-title">`;
        const rules2 = `</div>`;
        const pureString = (_c = (_a = title === null || title === void 0 ? void 0 : title.replace) === null || _a === void 0 ? void 0 : (_b = _a.call(title, rules1, '')).replace) === null || _c === void 0 ? void 0 : _c.call(_b, rules2, '').trim();
        title_list.push(pureString);
    });
    const content_rules = new RegExp(`<div class="jsx-2687283247 jsx-1763002358 block-value block-value(--|-- block-value--small)">[ -.0-9A-Z]+<\/div>`, 'g');
    const content_rules_list = (_b = baseInfo_div === null || baseInfo_div === void 0 ? void 0 : baseInfo_div[0]) === null || _b === void 0 ? void 0 : _b.match(content_rules);
    const content_list = [];
    content_rules_list === null || content_rules_list === void 0 ? void 0 : content_rules_list.forEach(content => {
        var _a, _b, _c, _d, _e;
        const rules1 = `<div class="jsx-2687283247 jsx-1763002358 block-value block-value--">`;
        const rules2 = `<div class="jsx-2687283247 jsx-1763002358 block-value block-value-- block-value--small">`;
        const rules3 = `</div>`;
        const pureString = (_e = (_d = (_c = (_a = content === null || content === void 0 ? void 0 : content.replace) === null || _a === void 0 ? void 0 : (_b = _a.call(content, rules1, '')).replace) === null || _c === void 0 ? void 0 : _c.call(_b, rules2, '')) === null || _d === void 0 ? void 0 : _d.replace) === null || _e === void 0 ? void 0 : _e.call(_d, rules3, '').trim();
        content_list.push(pureString);
    });
    let baseInfoArray = '';
    title_list.forEach((e, i) => {
        var _a, _b, _c, _d, _e, _f;
        baseInfoArray = baseInfoArray.concat((_f = (_d = (_c = (_b = (_a = title_list === null || title_list === void 0 ? void 0 : title_list[i]) === null || _a === void 0 ? void 0 : _a.concat) === null || _b === void 0 ? void 0 : _b.call(_a, ': ')) === null || _c === void 0 ? void 0 : _c.concat) === null || _d === void 0 ? void 0 : (_e = _d.call(_c, content_list === null || content_list === void 0 ? void 0 : content_list[i])).concat) === null || _f === void 0 ? void 0 : _f.call(_e, '\n'));
    });
    return baseInfoArray;
};
// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));
// Route handler to receive webhook events.
// This route is used to receive connection tests.
app.get('/', async (_, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Connected successfully!',
    });
});
// This route is used for the Webhook.
app.post('/webhook', bot_sdk_1.middleware(middlewareConfig), async (req, res) => {
    const events = req.body.events;
    // Process all of the received events asynchronously.
    const results = await Promise.all(events.map(async (event) => {
        try {
            await textEventHandler(event);
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(err);
            }
            // Return an error message.
            return res.status(500).json({
                status: 'error',
            });
        }
    }));
    // Return a successfull message.
    return res.status(200).json({
        status: 'success',
        results,
    });
});
// Create a server and listen to it.
app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});
