import Metadata from './Metadata'
import React from 'react'

export default function SectionHeader(
	{
		text,
		extra,
		dark,
		direction,
	}: {
		text: string;
		extra?: React.ReactNode;
		dark?: boolean;
		direction?: 'row' | 'col';
	},
) {
	return (
		<div className={`flex pb-1 items-center flex-${direction || 'row'}`}>
			<Metadata seoTitle={text} />
			<div
				className={`font-semibold text-4xl ${
					dark ? 'text-white' : 'text-gray-900'
				}`}
			>
				{text}
			</div>
			<div className="flex-1">{extra}</div>
		</div>
	)
}
