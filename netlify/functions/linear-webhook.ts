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
import { Handler } from "@netlify/functions";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET || "";

export const handler: Handler = async (event, context) => {
	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}

	const signature = event.headers["linear-signature"] || "";
	const rawBody = event.body || "";
	const computedSignature = crypto
		.createHmac("sha256", WEBHOOK_SECRET)
		.update(rawBody, "utf8")
		.digest("hex");

	if (signature !== computedSignature) {
		return { statusCode: 400, body: "Invalid signature" };
	}

	const payload = JSON.parse(rawBody);
	const { action, data, type, createdAt } = payload;

	console.log("=============================");
	console.log(action);
	console.log(data);
	console.log(type);
	console.log(createdAt);
	console.log("=============================");

	return {
		statusCode: 200,
		body: JSON.stringify({ message: "Success" }),
	};
};
