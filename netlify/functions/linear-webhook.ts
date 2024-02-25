import { Handler } from "@netlify/functions";
import {
	LinearIssue,
	Label,
	LinearLabelGithubRepositoryMapping,
	Assignee,
	LinearUserGithubUserMapping,
	GitHubSearchResponse,
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

const fetchGithubRepositoryName = (labels: Label[]): string => {
	if (!labels.length) {
		return GITHUB_DEFAULT_REPOSITORY;
	}

	const mappings = process.env
		.LINEAR_LABEL_GITHUB_REPOSITORY_MAPPING as unknown as LinearLabelGithubRepositoryMapping[];
	let result = "";
	for (const label of labels) {
		const mappingInfo = mappings.filter((v) => v.linearLabel === label.name);
		if (mappingInfo.length) {
			result = mappingInfo[0].githubRepository;
			break;
		}
	}

	if (!result) {
		result = GITHUB_DEFAULT_REPOSITORY;
	}

	return result;
};

const mappingLinearUserToGithubUserName = (creatorId: string): string => {
	const mappings = process.env
		.LINEAR_USER_GITHUB_USER_MAPPING as unknown as LinearUserGithubUserMapping[];

	const info = mappings.filter((v) => v.linearUserId === creatorId);

	return info ? info[0].githubUserName : "";
};

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

const create = async (data: LinearIssue) => {
	console.log("================= 【start】CREATE =================");

	const creatorGithubId = mappingLinearUserToGithubUserName(data.creatorId);
	const createToRepositoryName = fetchGithubRepositoryName(data.labels);

	const title = data.title;
	const body = data.id;
	const assignees = [creatorGithubId];

	createGitHubIssue(createToRepositoryName, title, body, assignees);

	console.log("================= 【end】CREATE =================");
};

const searchGitHubIssues = async (
	linearIssueId: string,
	repoName: string,
): Promise<number | null> => {
	const query = encodeURIComponent(
		`"${linearIssueId}" in:body repo:${GITHUB_OWNER_NAME}/${repoName}`,
	);
	const url = `https://api.github.com/search/issues?q=${query}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `token ${GITHUB_TOKEN}`,
			Accept: "application/vnd.github.v3+json",
		},
	});

	if (!response.ok) {
		console.error("Search request failed:", response.statusText);
		return null;
	}

	const data = (await response.json()) as GitHubSearchResponse;
	if (data.items.length === 0) {
		console.log("No issues found with the specified Linear Issue ID.");
		return null;
	}

	return data.items[0].number;
};

const closeGithubIssue = async (repoName: string, issueNumber: number) => {
	const url = `https://api.github.com/repos/${GITHUB_OWNER_NAME}/${repoName}/issues/${issueNumber}`;

	const response = await fetch(url, {
		method: "PATCH",
		headers: {
			Authorization: `token ${GITHUB_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ state: "closed" }),
	});

	console.log(response);
};

const update = async (data: LinearIssue) => {
	const mappings = process.env
		.LINEAR_LABEL_GITHUB_REPOSITORY_MAPPING as unknown as LinearLabelGithubRepositoryMapping[];

	const linearIssueId = data.id;

	let githubIssueNumber: number | null = null;
	let githubRepoName = "";

	for (const mapping of mappings) {
		const repoName = mapping.githubRepository;
		githubIssueNumber = await searchGitHubIssues(linearIssueId, repoName);
		if (githubIssueNumber) {
			githubRepoName = repoName;
			break;
		}
	}

	if (!githubIssueNumber || !githubRepoName) {
		console.log("Not found issue ot Repository");
		return;
	}

	// statusがdoneになった時だけ、githubのissueをcloseする
	if (data.state.type === "completed") {
		closeGithubIssue(githubRepoName, githubIssueNumber);
	}
};
