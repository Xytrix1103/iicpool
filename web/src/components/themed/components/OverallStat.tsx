import { cn } from '../util.ts'

export default function OverallStat(
	{
		status_text,
		color,
		number,
		percentage = false,
		dark = false,
		flex = false,
	}: {
		status_text: string;
		color?: 'green' | 'red' | 'yellow' | 'blue' | undefined;
		number: string | number;
		percentage?: boolean;
		dark?: boolean;
		flex?: boolean;
	},
) {
	const borderTextClasses = {
		'green': 'border-primary-green text-primary-green',
		'red': 'border-primary-red text-primary-red',
		'yellow': 'border-primary-yellow text-primary-yellow',
		'blue': 'border-primary-blue text-primary-blue',
	}

	return (
		<div
			className={cn(`flex flex-col gap-2 p-2.5 justify-center items-center border border-dashed border-input rounded-3xl backdrop-blur ${
				dark ? 'bg-black/[.4]' : 'bg-white/[.4]'
			}`)}
		>
			<div
				className={cn(`uppercase text-xs px-2 font-medium ${
					color
						? `text-primary-${color}`
						: dark
							? 'text-white'
							: 'text-black'
				}`)}
			>
				{status_text}
			</div>
			<div
				className={cn(`flex flex-col border rounded-3xl ${flex ? 'aspect-auto h-24 px-5' : 'aspect-square w-24'} justify-center items-center ${
					color
						? borderTextClasses[color]
						: `border-black ${dark ? ' text-white' : ' text-black'}`
				}`)}
			>
				<div className={cn(`font-black ${percentage ? 'text-4xl' : 'text-3xl'}`)}>
					{number}
				</div>
				<div className="text-xs">{percentage ? '%' : ''}</div>
			</div>
		</div>
	)
}