const modulename = "VersionControl";
import { VersionControl } from "@core/components/VersionControl";
import { AuthedCtx } from "@core/components/WebServer/ctxTypes";
import consoleFactory from "@extras/console";
import { z } from "zod";

const console = consoleFactory(modulename);

const actionUnion = z.discriminatedUnion("type", [
    z.object({ type: z.literal("checkout"), target: z.string() }),
    z.object({ type: z.literal("fetch") }),
    z.object({ type: z.literal("pull") }),
]);

export default async function VersionControlActions(ctx: AuthedCtx) {
    if (!ctx.admin.testPermission("server.version-control", modulename)) {
        return ctx.throw(
            401,
            "You don't have permission to manage version control"
        );
    }
    const action = actionUnion.parse(ctx.request.body);

    try {
        const vc = new VersionControl(
            ctx.txAdmin.fxRunner.config?.serverDataPath ?? ""
        );
        switch (action.type) {
            case "checkout":
                const prevTarget = await vc.getCheckedout();
                console.info(
                    `Checking out treeish '${action.target}' current target is '${prevTarget}'`
                );
                await vc.checkout(action.target);
                const newTarget = await vc.getCheckedout();
                console.ok(
                    `Successfully checked out '${action.target}' current target is '${newTarget}'`
                );
                return ctx.send({
                    success: true,
                    previous: prevTarget,
                    new: newTarget,
                });
            case "fetch":
                await vc.fetchOrigin();
                console.ok(`Successfully fetched from remote`);
                return ctx.send({ success: true });
            case "pull":
                await vc.pull();
                console.ok(`Successfully pulled changes from remote`);
                return ctx.send({ success: true });
        }
    } catch (e) {
        if (e instanceof Error) {
            return ctx.throw(
                `Failed to run action '${action.type}' error message:\n${e.message}`
            );
        }
        return ctx.throw(
            `Failed to run action '${action.type}' unkown error:\n${e}`
        );
    }
}
