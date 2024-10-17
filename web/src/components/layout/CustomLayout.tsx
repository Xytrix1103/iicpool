import logo from '../../assets/logo.png'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { CogIcon, HomeIcon, LogOutIcon, ShieldCheckIcon, UserCircleIcon, UsersIcon } from 'lucide-react'
import NavButton from '../themed/components/NavButton.tsx'
import { ScrollArea, ScrollBar } from '../themed/ui-kit/scroll-area.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../themed/ui-kit/dropdown-menu.tsx'
import { Button } from '../themed/ui-kit/button.tsx'
import { Toaster } from '../themed/ui-kit/toaster.tsx'

const CustomLayout = () => {
	const location = useLocation()

	const sideNavItems = [
		{
			icon: <HomeIcon size={24} color={location.pathname === '/' ? 'white' : 'black'} />,
			label: 'Home',
			path: '/',
		},
		{
			icon: <UsersIcon size={24} color={location.pathname.includes('/users') ? 'white' : 'black'} />,
			label: 'Users',
			path: '/users',
		},
		{
			icon: <ShieldCheckIcon size={24} color={location.pathname.includes('/admins') ? 'white' : 'black'} />,
			label: 'Admins',
			path: '/admins',
		},
	]

	return (
		<>
			<div
				className="flex flex-col h-full w-full bg-no-repeat bg-center text-black py-[1rem] px-[1.5rem] gap-[1rem]">
				<header className="flex justify-between">
					<div className="px-1 py-3 flex items-center gap-4">
						<Link to={'/'}>
							<img src={logo} alt="Logo" className="w-16 h-auto self-center" />
						</Link>
						<div className="font-semibold text-xl">IICPOOL - ADMIN</div>
					</div>
					<div className="px-1 py-3 flex items-center gap-2">
						<div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="px-3.5 py-1">
										<UserCircleIcon size={20} color="currentColor" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent side="bottom" align="end">
									<DropdownMenuItem>
										<div className="flex items-center gap-2">
											<UserCircleIcon size={20} />
											<div className="text-sm font-semibold">Profile</div>
										</div>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<div className="flex items-center gap-2">
											<CogIcon size={20} />
											<div className="text-sm font-semibold">Settings</div>
										</div>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<div className="flex items-center gap-2">
											<LogOutIcon size={20} />
											<div className="text-sm font-semibold">Logout</div>
										</div>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</header>
				<div className="flex flex-1 gap-[1.5rem] overflow-hidden">
					<nav className="flex flex-col gap-2 py-[3.75rem]">
						{
							sideNavItems.map((item, index) => (
								<NavButton
									key={index}
									href={item.path}
									svg={item.icon}
									text={item.label}
									selected={location.pathname === item.path}
								/>
							))
						}
					</nav>
					<ScrollArea className="flex-1">
						<Outlet />
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			</div>
			<Toaster />
		</>
	)
}

export default CustomLayout
