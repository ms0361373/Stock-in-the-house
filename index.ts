// Import all dependencies, mostly using destructuring for better view.
import { ClientConfig, Client, middleware, MiddlewareConfig, WebhookEvent, TextMessage, MessageAPIResponseBase, TextEventMessage } from '@line/bot-sdk';
import express, { Application, Request, Response } from 'express';
const request = require('request');
// Setup all LINE client and Express configurations.
const clientConfig: ClientConfig = {
  channelAccessToken: `csVTWHw2sveQzUMBSTuhbsjGTJN5tqHYwFDYXM6i5jr7ETBpmdi4H8JqJsx2bh4pVBYX9x+Dw5NL9joswgviRCoV7o6EIkL4DSxTpcAUBCGU+BK9VIHPXSmY1vqWMepsReHaExnTi97VDLwK9ds66gdB04t89/1O/w1cDnyilFU=` || '',
  channelSecret: `c87e18d98e242f44423ba085bd6b0060`,
};

const middlewareConfig: MiddlewareConfig = {
  channelAccessToken: `csVTWHw2sveQzUMBSTuhbsjGTJN5tqHYwFDYXM6i5jr7ETBpmdi4H8JqJsx2bh4pVBYX9x+Dw5NL9joswgviRCoV7o6EIkL4DSxTpcAUBCGU+BK9VIHPXSmY1vqWMepsReHaExnTi97VDLwK9ds66gdB04t89/1O/w1cDnyilFU=`,
  channelSecret: `c87e18d98e242f44423ba085bd6b0060` || '',
};

const PORT = process.env.PORT || 8080;

// Create a new LINE SDK client.
const client = new Client(clientConfig);

// Create a new Express application.
const app: Application = express();

// Function handler to receive the text.
const textEventHandler = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
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

  request('http://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_dat', async function (error: any, response: any) {

    const body = JSON.parse(response?.body)
    const data:string[] = body?.data;
  
    const stock:any = data?.find?.(stocks => stocks?.[0] === text);
    if(!stock) return;
    const info = `
      證券代號: ${stock?.[0]}
      證券名稱: ${stock?.[1]}
      成交股數: ${stock?.[2]}
      成交金額: ${stock?.[3]}
      開盤價: ${stock?.[4]}
      最高價: ${stock?.[5]}
      最低價: ${stock?.[6]}
      收盤價: ${stock?.[7]}
      漲跌價差: ${stock?.[8]}
      成交筆數: ${stock?.[9]}
    `
    await client.replyMessage(replyToken, { type: 'text', text: info });
  });

  // Reply to the user.
  
};




// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));

// Route handler to receive webhook events.
// This route is used to receive connection tests.
app.get(
  '/',
  async (_: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
      status: 'success',
      message: 'Connected successfully!',
    });
  }
);

// This route is used for the Webhook.
app.post(
  '/webhook',
  middleware(middlewareConfig),
  async (req: Request, res: Response): Promise<Response> => {
    const events: WebhookEvent[] = req.body.events;

    // Process all of the received events asynchronously.
    const results = await Promise.all(
      events.map(async (event: WebhookEvent) => {
        try {
          await textEventHandler(event);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error(err);
          }

          // Return an error message.
          return res.status(500).json({
            status: 'error',
          });
        }
      })
    );

    // Return a successfull message.
    return res.status(200).json({
      status: 'success',
      results,
    });
  }
);




// Create a server and listen to it.
app.listen(PORT, () => {
  console.log(`Application is live and listening on port ${PORT}`);
});
