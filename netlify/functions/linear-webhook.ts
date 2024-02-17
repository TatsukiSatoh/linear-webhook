// // TypeScriptファイル: netlify/functions/linear-webhook.ts
// import express, { Request, Response } from 'express';
// import serverless from 'serverless-http';
// import type { Handler } from '@netlify/functions';
// import crypto from 'crypto';

// const app = express();

// app.use(express.json({
//   verify: (req: Request, res: Response, buf: Buffer) => {
//     (req as any).rawBody = buf;
//   },
// }));

// app.post("/.netlify/functions/linear-webhook", (req: Request, res: Response) => {
//   const rawBody = (req as any).rawBody as Buffer;
//   const WEBHOOK_SECRET = "your_webhook_secret_here"; // 安全な場所に保存してください
//   const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
//   if (signature !== req.headers['linear-signature']) {
//     return res.status(400).send("Invalid signature.");
//   }

//   // ここでWebhookデータを処理します

//   res.sendStatus(200);
// });

// const handler: Handler = serverless(app);

// export { handler };


// TypeScriptファイル: netlify/functions/linear-webhook.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // HTTP リクエストの処理
  // ここで、リクエストの検証、処理、レスポンスの生成を行います

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Success" })
  };
};
