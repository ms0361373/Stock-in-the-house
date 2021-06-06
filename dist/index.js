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
    // Process all variables here.
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }
    // Process all message related variables here.
    const { replyToken } = event;
    const { text } = event.message;
    // Create a new message.
    // const msg: TextMessage = {
    //   type: 'text',
    //   text,
    // };
    request('http://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_dat', async function (error, response) {
        var _a;
        const body = JSON.parse(response === null || response === void 0 ? void 0 : response.body);
        const data = body === null || body === void 0 ? void 0 : body.data;
        const stock = (_a = data === null || data === void 0 ? void 0 : data.find) === null || _a === void 0 ? void 0 : _a.call(data, stocks => (stocks === null || stocks === void 0 ? void 0 : stocks[0]) === text);
        if (!stock)
            return;
        const info = `
      證券代號: ${stock === null || stock === void 0 ? void 0 : stock[0]}
      證券名稱: ${stock === null || stock === void 0 ? void 0 : stock[1]}
      成交股數: ${stock === null || stock === void 0 ? void 0 : stock[2]}
      成交金額: ${stock === null || stock === void 0 ? void 0 : stock[3]}
      開盤價: ${stock === null || stock === void 0 ? void 0 : stock[4]}
      最高價: ${stock === null || stock === void 0 ? void 0 : stock[5]}
      最低價: ${stock === null || stock === void 0 ? void 0 : stock[6]}
      收盤價: ${stock === null || stock === void 0 ? void 0 : stock[7]}
      漲跌價差: ${stock === null || stock === void 0 ? void 0 : stock[8]}
      成交筆數: ${stock === null || stock === void 0 ? void 0 : stock[9]}
    `;
        await client.replyMessage(replyToken, { type: 'text', text: info });
    });
    // Reply to the user.
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
