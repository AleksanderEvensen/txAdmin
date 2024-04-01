import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthedFetcher, useBackendApi } from "@/hooks/fetch";
import { useSetPageTitle } from "@/hooks/pages";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { BookMarkedIcon, ChevronsUpDown, GitBranchIcon, RefreshCcwIcon, TagIcon } from "lucide-react";
import { useState } from "react";



export default function SourceControl() {
	const authedFetcher = useAuthedFetcher();
    const setPageTitle = useSetPageTitle();
	const callAction = useBackendApi({
		method: 'POST',
		path: '/version-control/actions'
	});
	setPageTitle();


	const {isLoading, error, data: gitTargets} = useQuery<any>({
		queryKey: ['getGitCheckoutTargets'],
		gcTime: 30_000,
		queryFn: () => authedFetcher(`/version-control/getCheckoutTargets`),
	});
	const { isLoading: commitsLoading, error: commitError, data: commitData } = useQuery<any>({
		queryKey: ['getLog'],
		gcTime: 30_000,
		queryFn: () => authedFetcher(`/version-control/getLog`),
	});

	async function handleCheckout(target: string) {
		console.log(await callAction({ data: { type: "checkout", target } }));
	}

	if (isLoading || commitsLoading) return <div>Loading...</div>

	if (error) return <div>Error occured: {error.message}</div>
	if (commitError) return <div>Error occured: {commitError.message}</div>

	// console.log({ isLoading, error, gitTargets });
	// console.log({ commitsLoading, commitError, commitData });


	const targets: { name: string, type: "branch" | "tag" }[] = [...gitTargets?.branches.map((branch: { name: string }) => ({ name: branch.name, type: "branch" })), ...gitTargets?.tags.map((tag: string) => ({ name: tag, type: "tag" }))];

	const topBarControlStyle = cn("flex flex-row items-center gap-2 text-left");
	const topBarControlIconStyle = cn("w-10 h-10");

    return (
		<div className="flex flex-col gap-4 w-full">
			
			{/* TopBar */}
			<div className={cn("flex flex-row w-full bg-card text-card-foreground shadow-sm p-4 border-border border rounded-xl")}>
				
				{/* Repository */}
				<div className={topBarControlStyle}>
					<BookMarkedIcon className={topBarControlIconStyle} strokeWidth={1.5} />
					<div className="flex flex-col">
						<p className="text-sm text-gray-400">Repository</p>
						<p>AleksanderEvensen/test-server-data</p>
					</div>
				</div>		
				
				<CtrlSep />
				
				{/* Branch */}
				<CheckoutTargetPicker setTarget={handleCheckout} current={gitTargets.current} targets={targets} />	

				<CtrlSep />
				
				{/* Fetch / pull */}
				<button className={topBarControlStyle}>
					<RefreshCcwIcon className={topBarControlIconStyle} strokeWidth={1.5} />
					<div className="flex flex-col">
						<p>Fetch origin</p>
						<p className="text-sm text-gray-400">Last fetched just now</p>
					</div>
				</button>
				<CtrlSep />

				
				
			</div>

			{/* Commit History */}
			<div className={cn("flex flex-col w-full gap-5 bg-card text-card-foreground shadow-sm p-4 border-border border rounded-xl")}>
				{ commitData.incomming.map((v:any) => (
					<div> Incomming Commit({v.hash}) | {v.author.name} | {v.message}</div>
				)) }
				{ commitData.log.map((v:any) => (
					<div> Commit({v.hash}) | {v.author.name} | {v.message}</div>
				)) }
			</div>
		</div>
	);
}

function CtrlSep() {
	return <div className={cn("mx-5 bg-zinc-700 w-[1px] h-full")} />
}

export const CheckoutTargetPicker: React.FC<{current:any, setTarget: (target: string) => void, targets: { name: string, type: "tag" | "branch" }[]}> = ({targets, setTarget, current}) => {
	const [open, setOpen] = useState(false)
	const [value, setValue] = useState(current.trim() as string);
   
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					className="min-w-[220px] justify-between"
				>
					<div className="flex gap-2 items-center">
					{ targets.find(v => v.name == value)?.type == "tag" ? <TagIcon className="h-8 w-8 shrink-0" /> : <GitBranchIcon className="h-8 w-8 shrink-0" />}
					<div className="flex flex-col text-left">
						<span className="opacity-50">Current {targets.find(v => v.name == value)?.type == "tag" ? "Tag" : "Branch"}</span>
						<span>{value}</span>
					</div>
					</div>
					<ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
			<Command>
				<CommandInput placeholder="Search..." />
				<CommandEmpty>No branch or tag found.</CommandEmpty>
				<CommandGroup heading="Branches">
					{ targets.filter(v => v.type == "branch").map(branch => (
						<CommandItem
							key={branch.name}
							value={branch.name}
							onSelect={(value) => {
								setTarget(value);
								setValue(value);
								setOpen(false);
							}}
						>
							{branch.name}
						</CommandItem>
					)) }
				</CommandGroup>
				<CommandGroup heading="Tags">
					{ targets.filter(v => v.type == "tag").map(tag => (
						<CommandItem
							key={tag.name}
							value={tag.name}
							onSelect={(value) => {
								setTarget(value);
								setValue(value);
								setOpen(false);
							}}
						>
							{tag.name}
						</CommandItem>
					)) }
				</CommandGroup>
			</Command>
			</PopoverContent>
		</Popover>
	)
}