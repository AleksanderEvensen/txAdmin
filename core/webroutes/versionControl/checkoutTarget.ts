const modulename = "VersionControl";
import { VersionControl } from "@core/components/VersionControl";
import { AuthedCtx } from "@core/components/WebServer/ctxTypes";
import consoleFactory from "@extras/console";

const console = consoleFactory(modulename);

export default async function VersionControlCheckoutTarget(ctx: AuthedCtx) {
	if (!ctx.admin.testPermission('server.version-control', modulename)) {
		return { error: 'You don\'t have permission to manage version control' };
	}
	try {
		const vc = new VersionControl(ctx.txAdmin.fxRunner.config?.serverDataPath ?? "");
		
		await vc.GitInstance.checkout(ctx.request.body.target);

		return ctx.send({ success: true });
	} catch(e) {
		console.error("Faild to checkout target:", e);
		return ctx.send({ success: false, error: e });
	}
}