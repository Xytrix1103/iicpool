import Metadata from './Metadata'
import React from 'react'

export default function SectionHeader(
	{
		text,
		extra,
		dark,
	}: {
		text: string;
		extra?: React.ReactNode;
		dark?: boolean;
	},
) {
	return (
		<div className="flex pb-1 items-center">
			<Metadata seoTitle={text} />
			<div
				className={`flex-1 font-semibold text-3xl ${
					dark ? 'text-white' : 'text-gray-900'
				}`}
			>
				{text}
			</div>
			<div>{extra}</div>
		</div>
	)
}
