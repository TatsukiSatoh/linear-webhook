export interface LinearIssue {
	id: string;
	createdAt: string;
	updatedAt: string;
	number: number;
	title: string;
	priority: number;
	boardOrder: number;
	sortOrder: number;
	startedAt: string;
	labelIds: string[];
	teamId: string;
	cycleId: string;
	previousIdentifiers: string[];
	creatorId: string;
	assigneeId: string;
	stateId: string;
	priorityLabel: string;
	botActor: BotActor;
	identifier: string;
	url: string;
	assignee: Assignee;
	cycle: Cycle;
	state: State;
	team: Team;
	subscriberIds: string[];
	labels: Label[];
}

export interface BotActor {
	id: string;
	type: string;
	name: string;
	avatarUrl: string;
}

export interface Assignee {
	id: string;
	name: string;
}

export interface Cycle {
	id: string;
	number: number;
	startsAt: string;
	endsAt: string;
}

export interface State {
	id: string;
	color: string;
	name: string;
	type: string;
}

export interface Team {
	id: string;
	key: string;
	name: string;
}

export interface Label {
	id: string;
	color: string;
	name: string;
}

export interface LinearUserGithubUserMapping {
	linearUserId: string;
	githubUserName: string;
}

export interface LinearLabelGithubRepositoryMapping {
	linearLabel: string;
	githubRepository: string;
}
