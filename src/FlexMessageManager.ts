import { FlexComponent, FlexMessage, FlexText } from "@line/bot-sdk";

export default class FlexMessageManager {
    genertateFlexMessage(contents: FlexComponent[]): FlexMessage{
        const flexMessage: FlexMessage = {
            "type": "flex",
            "altText": "this is a flex message",
            "contents": {
                "type": "bubble",
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": contents
                }
            }
        }
        return flexMessage;
    }
    
    genertateNomalFlexText (text:string, style?: FlexTextStyle):FlexText{
        const content: FlexText = {
            "type": "text",
            "size": "md",
            "color": "#000000",
            "text": text,
            ...style
        };
        return content;
    }
}

export interface FlexTextStyle {
    size?: string | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "3xl" | "4xl" | "5xl";
    color?: string;
}