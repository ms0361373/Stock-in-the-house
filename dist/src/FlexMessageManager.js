"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FlexMessageManager {
    genertateFlexMessage(contents) {
        const flexMessage = {
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
        };
        return flexMessage;
    }
    genertateNomalFlexText(text, style) {
        const content = Object.assign({ "type": "text", "size": "md", "color": "#000000", "text": text }, style);
        return content;
    }
}
exports.default = FlexMessageManager;
