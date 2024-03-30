import { existsSync } from "fs";
import { SimpleGit, SimpleGitOptions, simpleGit } from "simple-git";

export class VersionControl {
    private git: SimpleGit;
    private repoPath: string;

    get GitInstance(): SimpleGit {
        return this.git;
    }

    /**
     * Creates a version control instance for a repository located at the specified path
     * @param repoPath The root path to the repository
     * @throws Will throw an error if the path doesn't exist or simple-git fails to initialize
     */
    constructor(repoPath: string) {
        if (!existsSync(repoPath)) {
            throw new Error(`The specified path '${repoPath}' does not exist`);
        }

        this.repoPath = repoPath;

        try {
            const options: Partial<SimpleGitOptions> = {
                baseDir: this.repoPath,
                trimmed: false,
            };
            this.git = simpleGit(options);
        } catch (e) {
            throw new Error("Failed to initialize simple-git\n" + e);
        }
    }

    /**
     *
     * @returns { boolean } If the specified path is a repository or not
     * @throws Will throw an error if the git command fails
     */
    async isRepository() {
        try {
            return await this.git.checkIsRepo();
        } catch (e) {
            throw new Error("Faild to check the repo\n" + e);
        }
    }

    async getBranches() {
        const { branches, current, detached } = await this.git.branchLocal();

        if (detached) {
            delete branches[current];
        }

        return Object.entries(branches).map(
            ([_, { name, current, commit, label: commitMsg }]) => ({
                name,
                current,
                commit,
                commitMsg,
            })
        );
    }

    async getCurrentCheckoutTarget() {
        const { current } = await this.git.branchLocal();
        return current;
    }

    async getCurrentBranch() {
        return (await this.getBranches()).find((branch) => branch.current);
    }

    async getTags() {
        const { all: tags } = await this.git.tags();
        return tags;
    }

    async getDefaultBranch() {
        const regx = /refs\/heads\/(\w+)/i;
        const lsResult = await this.git?.listRemote([
            "--symref",
            "origin",
            "HEAD",
        ]);
        const branch = regx.exec(lsResult ?? "")?.[1];
        return branch;
    }

    async getIncommingCommits() {
        const currentBranch = await this.getCurrentBranch();
        if (!currentBranch) return [];

        await this.fetchOrigin();

        const { all: logEntries } = await this.git.log({
            from: "HEAD",
            to: `origin/main`,
        });
        return logEntries.map(
            ({ message, author_name, author_email, date, hash }) => ({
                hash,
                message,
                date,
                author: { name: author_name, email: author_email },
            })
        );
    }

    async getCommitLog() {
        const { all: logEntries } = await this.git.log();
        return logEntries.map(
            ({ message, author_name, author_email, date, hash }) => ({
                hash,
                message,
                date,
                author: { name: author_name, email: author_email },
            })
        );
    }

    async fetchOrigin() {
        return await this.git.fetch();
    }

    async pullIncomming() {
        return await this.git.pull();
    }
}
