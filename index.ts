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
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const { replyToken } = event;
  const { text } = event.message;

  request('http://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_dat', async function (error: any, response: any) {

    const body = JSON.parse(response?.body)
    const data:string[] = body?.data;
   
    const stock:any = data?.find?.(stocks => stocks?.[0] === text);
   
    if(!stock) return;
    let info:string=`證券代號: ${stock[0]}\n證券名稱: ${stock[1]}\n成交金額: ${stock[3]}\n漲跌價差: ${stock[8]}\n`;
    
    const url = `https://invest.cnyes.com/twstock/tws/${text}`
    request(url, async function (error: any, response: any) {
      // const body = JSON.parse(response?.body)
      const data:string = await generateBaseInfo(response?.body);
     
      if(!data){
        client.replyMessage(replyToken, { type: 'text', text: `查詢失敗` });
        return;
      }
      const finalString = info.concat(data);
      await client.replyMessage(replyToken, { type: 'text', text: finalString });
    });
  });
  
 

  // Reply to the user.
  
};

const generateBaseInfo = (body: string): string => {
  const baseInfo_rules = new RegExp(`<div class="jsx-838437900 profile-data"><div class="jsx-2687283247 jsx-1763002358 data-block data-block--wider"><div class="jsx-2687283247 jsx-1763002358 block-title">成交張數<\/div>.*市值 .*<\/div><div class="jsx-2687283247 jsx-1763002358 block-value block-value--">.*<\/div><\/div><\/div>`,'g')
  const baseInfo_div = body.match(baseInfo_rules)


  const title_rules = new RegExp(`<div class="jsx-2687283247 jsx-1763002358 block-title">[\u4e00-\u9fa50-9]*<\/div>`,'g');
  const title_rules_list = baseInfo_div?.[0]?.match(title_rules);
  const title_list:string[] = [];
  title_rules_list?.forEach(title => {
    const rules1 = `<div class="jsx-2687283247 jsx-1763002358 block-title">`
    const rules2 = `</div>`
    const pureString = title?.replace?.(rules1,'').replace?.(rules2,'').trim();
    title_list.push(pureString);
  })


  const content_rules = new RegExp(`<div class="jsx-2687283247 jsx-1763002358 block-value block-value(--|-- block-value--small)">[ -.0-9A-Z]+<\/div>`,'g');
  const content_rules_list = baseInfo_div?.[0]?.match(content_rules);

  const content_list:string[] = [];
  content_rules_list?.forEach(content => {
    const rules1 = `<div class="jsx-2687283247 jsx-1763002358 block-value block-value--">`
    const rules2 = `<div class="jsx-2687283247 jsx-1763002358 block-value block-value-- block-value--small">`
    const rules3 = `</div>`
    const pureString = content?.replace?.(rules1,'').replace?.(rules2,'')?.replace?.(rules3,'').trim();
    content_list.push(pureString);
  })

  let baseInfoArray:string='';
  title_list.forEach((e,i) => {
    baseInfoArray = baseInfoArray.concat(title_list?.[i]?.concat?.(': ')?.concat?.(content_list?.[i]).concat?.('\n'));
  })
  return baseInfoArray
}


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