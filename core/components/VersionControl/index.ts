import { existsSync } from "fs";
import { SimpleGit, SimpleGitOptions, simpleGit } from "simple-git";
import type { GitBranch, GitCommit } from "@shared/versionControlTypes";

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

        const options: Partial<SimpleGitOptions> = {
            baseDir: this.repoPath,
            trimmed: false,
        };
        this.git = simpleGit(options);
    }

    async isRepository() {
        try {
            return await this.git.checkIsRepo();
        } catch (e: any) {
            throw new Error(
                `Failed to check if 'baseDir' was a git repository. ${
                    e?.message ?? ""
                }`
            );
        }
    }

    async getBranches() {
        try {
            const { branches, current, detached } =
                await this.git.branchLocal();

            // if a tag or hash is checked out it will be included in the branch list
            // this is not prefferable, therefore we delete it
            if (detached) {
                delete branches[current];
            }

            return Object.entries(branches).map<GitBranch>(
                ([_, branchSummary]) => ({
                    name: branchSummary.name,
                    active: branchSummary.current,
                    latestCommit: {
                        hash: branchSummary.commit,
                        message: branchSummary.name,
                    },
                })
            );
        } catch (e: any) {
            throw new Error(
                `Failed to get the local branches. ${e?.message ?? ""}`
            );
        }
    }

    async getCheckedout() {
        try {
            const { current } = await this.git.branchLocal();
            return current;
        } catch (e: any) {
            throw new Error(
                `Failed to get the local branches. ${e?.message ?? ""}`
            );
        }
    }

    async getTags() {
        try {
            const { all: tags } = await this.git.tags();
            return tags;
        } catch (e: any) {
            throw new Error(`Failed to get the tags. ${e?.message ?? ""}`);
        }
    }

    async getIncommingCommits() {
        try {
            await this.git.fetch();
            const { current, detached } = await this.git.branchLocal();
            // If a tag or commit hash is checked out, then there is no incomming requests.
            if (detached) return [];

            const { all: commits } = await this.git.log({
                from: "HEAD",
                to: `origin/${current}`,
            });

            return commits.map<GitCommit>(
                ({
                    message,
                    author_name: name,
                    author_email: email,
                    date,
                    hash,
                }) => ({
                    hash,
                    message,
                    date,
                    author: { name, email },
                })
            );
        } catch (e: any) {
            throw new Error(
                `Failed to fetch the incomming requests. ${e?.message ?? ""}`
            );
        }
    }

    async getCommitLog() {
        try {
            const { all: commits } = await this.git.log();
            return commits.map<GitCommit>(
                ({
                    message,
                    author_name: name,
                    author_email: email,
                    date,
                    hash,
                }) => ({
                    hash,
                    message,
                    date,
                    author: { name, email },
                })
            );
        } catch (e: any) {
            throw new Error("Failed to get the git log. " + e?.message ?? "");
        }
    }

    async fetchOrigin(prune: boolean = false) {
        try {
            return await this.git.fetch(prune ? ["--prune"] : undefined);
        } catch (e: any) {
            throw new Error(
                `Failed to ${
                    prune ? "fetch and prune" : "fetch"
                } from the remote. ${e?.message ?? ""}`
            );
        }
    }

    async pull() {
        try {
            return await this.git.pull();
        } catch (e: any) {
            throw new Error(
                `Failed to fetch from the remote. ${e?.message ?? ""}`
            );
        }
    }

    async checkout(treeish: string) {
        try {
            return await this.git.checkout(treeish);
        } catch (e: any) {
            throw new Error(
                `Failed to checkout the treeish '${treeish}'. ${
                    e?.message ?? ""
                }`
            );
        }
    }
}
