const modulename = "VersionControl";
import { VersionControl } from "@core/components/VersionControl";
import { AuthedCtx } from "@core/components/WebServer/ctxTypes";
import consoleFactory from "@extras/console";

const console = consoleFactory(modulename);

export default async function VersionControlGetCheckoutTargets(ctx: AuthedCtx) {
    if (!ctx.admin.testPermission("server.version-control", modulename)) {
        return { error: "You don't have permission to manage version control" };
    }

    try {
        const vc = new VersionControl(
            ctx.txAdmin.fxRunner.config?.serverDataPath ?? ""
        );
        const branches = await vc.getBranches();
        const current = await vc.getCheckedout();
        const tags = await vc.getTags();
        return ctx.send({ success: true, branches, tags, current });
    } catch (e) {
        console.error("Faild to fetch branches and tags:", e);
        return ctx.send({ success: false, error: e });
    }
}
