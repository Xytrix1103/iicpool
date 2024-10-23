import { Button } from '../ui-kit/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui-kit/tooltip'
import { Link } from 'react-router-dom'
import React from 'react'

export default function NavButton({ href, svg, text, selected = false }: {
	href: string,
	svg: React.ReactNode,
	text: string,
	selected?: boolean
}) {
	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Link to={href}>
						<Button variant={!selected ? 'outline' : 'selected'}
								className={`${!selected ? 'text-black' : 'text-white'} h-14 w-14`}>
							{svg}
						</Button>
					</Link>
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={10}>
					<p>{text}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
