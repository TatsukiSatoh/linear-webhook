// TypeScriptファイル: netlify/functions/linear-webhook.ts
import { Handler } from "@netlify/functions";
import {
	LinearIssue,
	Label,
	LinearLabelGithubRepositoryMapping,
	Assignee,
	LinearUserGithubUserMapping,
} from "./type";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_OWNER_NAME = process.env.GITHUB_OWNER_NAME || "";
const GITHUB_DEFAULT_REPOSITORY = process.env.GITHUB_DEFAULT_REPOSITORY || "";

type LinearAction = "create" | "update" | "delete";

const AVAILABLE_ISSUE = "Issue";

export const handler: Handler = async (event, context) => {
	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: "Method Not Allowed Linear webhook" };
	}

	if (!GITHUB_TOKEN.length) {
		return { statusCode: 400, body: "No set github token" };
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
	const { action, data, type, createdAt } = payload as {
		action: LinearAction;
		data: LinearIssue;
		type: string;
		createdAt: string;
	};

	if (type !== AVAILABLE_ISSUE) {
		console.error(`No webhook type: ${type}`);
		return {
			statusCode: 401,
			body: JSON.stringify({ message: "No webhook type" }),
		};
	}

	console.log(action);
	console.log(data);
	console.log(type);
	console.log(createdAt);

	// issueのtypeに合わせて、処理を分岐する
	// create -> githubのissueを作成する
	// update -> githubのissueを検索する -> linearのステータスがdoneになっていれば、対象のissueをcloseする (or assignだけ更新する)、もしかしたら、リポジトリを作成する
	// delete -> githubのissueを検索する -> 対象のissueをcloseする

	// 固定値でissueを作成できるか動作確認
	// const createIssueResponse = await createGitHubIssue(
	// 	"mypage-front",
	// 	data.title,
	// 	data.id,
	// 	["TatsukiSatoh"],
	// );

	// console.log(createIssueResponse);

	return {
		statusCode: 200,
		body: JSON.stringify({ message: "Success" }),
	};
};

// const fetchGithubRepositoryName = (labels: Label[]): string => {
// 	const mappings = process.env
// 		.LINEAR_LABEL_GITHUB_REPOSITORY_MAPPING as unknown as LinearLabelGithubRepositoryMapping[];
// 	let result = "";
// 	for (const label of labels) {
// 		const mappingInfo = mappings.filter((v) => v.linearLabel === label.name);
// 		if (mappingInfo.length) {
// 			result = mappingInfo[0].githubRepository;
// 			break;
// 		}
// 	}

// 	if (!result) {
// 		result = GITHUB_DEFAULT_REPOSITORY;
// 	}

// 	return result;
// };

// const mappingLinearUserToGithubUserName = (assignee: Assignee): string => {
// 	const mappings = process.env
// 		.LINEAR_USER_GITHUB_USER_MAPPING as unknown as LinearUserGithubUserMapping[];

// 	const info = mappings.filter((v) => v.linearUserId === assignee.id);

// 	return info ? info[0].githubUserName : "";
// };

const createGitHubIssue = async (
	repoName: string,
	title: string,
	body: string,
	assignees: string[],
) => {
	console.log(GITHUB_OWNER_NAME);
	const url = `https://api.github.com/repos/${GITHUB_OWNER_NAME}/${repoName}/issues`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `token ${GITHUB_TOKEN}`,
		},
		body: JSON.stringify({ title, body, assignees }),
	});
	console.log(response);
	return response.json();
};
