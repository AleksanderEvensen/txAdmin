export type GitBranch = {
    active: boolean;
    name: string;
    latestCommit: {
        hash: string;
        message: string;
    };
};

export type GitCommit = {
    hash: string;
    message: string;
    date: string;
    author: {
        name: string;
        email: string;
    };
};
