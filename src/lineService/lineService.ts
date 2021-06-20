import { Client, middleware, WebhookEvent, MessageAPIResponseBase, FlexMessage, FlexComponent } from '@line/bot-sdk';
import express, { Application, Request, Response } from 'express';
import FlexMessageManager, { FlexTextStyle } from '../FlexMessageManager';
import { ClientConfig, middlewareConfig } from './clientConfig';
const request = require('request');
const client = new Client(ClientConfig);
const PORT = process.env.PORT || 8080;
const app: Application = express();
const flexMessageManager = new FlexMessageManager();
app.get(
    '/',
    async (_: Request, res: Response): Promise<Response> => {
        return res.status(200).json({
            status: 'success',
            message: 'Connected successfully!',
        });
    }
);

app.post(
    '/webhook',
    middleware(middlewareConfig),
    async (req: Request, res: Response): Promise<Response> => {
        const events: WebhookEvent[] = req.body.events;

        const results = await Promise.all(
            events.map(async (event: WebhookEvent) => {
                try {
                    await textEventHandler(event);
                } catch (err: unknown) {
                    if (err instanceof Error) {
                        console.error(err);
                    }

                    return res.status(500).json({
                        status: 'error',
                    });
                }
            })
        );

        return res.status(200).json({
            status: 'success',
            results,
        });
    }
);


app.listen(PORT, () => {
    console.log(`Application is live and listening on port ${PORT}`);
});


const textEventHandler = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return;
    }

    const { replyToken } = event;
    const { text } = event.message;

    request('http://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_dat', async function (error: any, response: any) {

        const body = JSON.parse(response?.body)
        const data: string[] = body?.data;

        const stock: any = data?.find?.(stocks => stocks?.[0] === text);

        if (!stock) return;
        const info: FlexComponent[] = [];
        stock?.forEach((e:string,i:number) => {
            if(i === 0){
                info.push(flexMessageManager.genertateNomalFlexText(`證券代號: ${stock[0]}`))
            }
            if(i === 1){
                info.push(flexMessageManager.genertateNomalFlexText(`證券名稱: ${stock[1]}`))
            }
            if(i === 3){
                info.push(flexMessageManager.genertateNomalFlexText(`成交金額: ${stock[3]}`))
            }
            if(i === 8){
                const style: FlexTextStyle = {
                    color: e.includes('-')? '#ff0000' : '#00EC00'
                }
                info.push(flexMessageManager.genertateNomalFlexText(`漲跌價差: ${stock[8]}`,style))
            }
        });


        const url = `https://invest.cnyes.com/twstock/tws/${text}`
        request(url, async function (error: any, response: any) {
            // const body = JSON.parse(response?.body)
            const data: FlexComponent[] = await generateBaseInfo(response?.body);

            if (data?.length < 1) {
                client.replyMessage(replyToken, { type: 'text', text: `查詢失敗` });
                return;
            }
            const finalString = flexMessageManager.genertateFlexMessage(info.concat(data));
            await client.replyMessage(replyToken, finalString);
        });
    });
};

const generateBaseInfo = (body: string): FlexComponent[] => {
    const baseInfo_rules = new RegExp(`<div class="jsx-838437900 profile-data"><div class="jsx-2687283247 jsx-1763002358 data-block data-block--wider"><div class="jsx-2687283247 jsx-1763002358 block-title">成交張數<\/div>.*市值 .*<\/div><div class="jsx-2687283247 jsx-1763002358 block-value block-value--">.*<\/div><\/div><\/div>`, 'g')
    const baseInfo_div = body.match(baseInfo_rules)


    const title_rules = new RegExp(`<div class="jsx-2687283247 jsx-1763002358 block-title">[\u4e00-\u9fa50-9]*<\/div>`, 'g');
    const title_rules_list = baseInfo_div?.[0]?.match(title_rules);
    const title_list: string[] = [];
    title_rules_list?.forEach(title => {
        const rules1 = `<div class="jsx-2687283247 jsx-1763002358 block-title">`
        const rules2 = `</div>`
        const pureString = title?.replace?.(rules1, '').replace?.(rules2, '').trim();
        title_list.push(pureString);
    })


    const content_rules = new RegExp(`<div class="jsx-2687283247 jsx-1763002358 block-value block-value(--|-- block-value--small)">[ -.0-9A-Z]+<\/div>`, 'g');
    const content_rules_list = baseInfo_div?.[0]?.match(content_rules);

    const content_list: string[] = [];
    content_rules_list?.forEach(content => {
        const rules1 = `<div class="jsx-2687283247 jsx-1763002358 block-value block-value--">`
        const rules2 = `<div class="jsx-2687283247 jsx-1763002358 block-value block-value-- block-value--small">`
        const rules3 = `</div>`
        const pureString = content?.replace?.(rules1, '').replace?.(rules2, '')?.replace?.(rules3, '').trim();
        content_list.push(pureString);
    })

    let baseInfoArray: FlexComponent[] = [];
    title_list.forEach((e, i) => {
        const info = title_list?.[i]?.concat?.(': ')?.concat?.(content_list?.[i]);
        let style: FlexTextStyle = {
            color: '#000000'
        }
        if(title_list?.[i] === '本益比'){
            if(parseInt?.(content_list?.[i]) <= 10) {
                style =  { color: '#00EC00'};
            }

            if(parseInt?.(content_list?.[i]) > 20) {
                style =  { color: '#ff0000'};
            }
        }

        if(title_list?.[i] === '本淨比'){
            if(parseInt?.(content_list?.[i]) < 1) {
                style =  { color: '#C6A300'};
            }

            if(parseInt?.(content_list?.[i]) === 1) {
                style =  { color: '#00EC00'};
            }

            if(parseInt?.(content_list?.[i]) > 1) {
                style =  { color: '#ff0000'};
            }
        }
        baseInfoArray = baseInfoArray.concat(flexMessageManager.genertateNomalFlexText(info,style));
    })
    return baseInfoArray
}