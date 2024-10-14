import logo from '../../assets/logo.png'
import { Outlet, useLocation } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.tsx'
import { useContext, useState } from 'react'
import { HomeIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react'
import NavButton from '../themed/components/NavButton.tsx'
import { ScrollArea, ScrollBar } from '../themed/ui-kit/scroll-area.tsx'

const CustomLayout = () => {
	const { profile } = useContext(AuthContext)
	const location = useLocation()
	const [showMenu, setShowMenu] = useState<boolean>(false)
	
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
		<div className="flex flex-col h-full w-full bg-no-repeat bg-center text-black">
			<header className="w-full h-auto bg-white flex items-center py-[1rem] px-[2rem] flex-row justify-between">
				<div className="flex h-full items-center gap-6 flex-row justify-center">
					<img src={logo} alt="Logo" className="w-16 h-auto self-center" />
					<div className="font-semibold text-xl">IICPOOL - ADMIN</div>
				</div>
				<div className="relative">
					<div
						className="w-12 h-12 rounded-full cursor-pointer bg-center bg-cover"
						style={{
							backgroundImage: `url(${profile?.photo_url})`,
						}}
						onClick={() => setShowMenu(!showMenu)}
					></div>
					{
						showMenu && (
							<div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
								<div className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex-row`}>
									<i className="fas fa-user-circle mr-2"></i>
									<span>Profile</span>
								</div>
								<div className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex-row`}>
									<i className="fas fa-cog mr-2"></i>
									<span>Settings</span>
								</div>
								<div className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex-row`}>
									<i className="fas fa-sign-out-alt mr-2"></i>
									<span>Logout</span>
								</div>
							</div>
						)
					}
				</div>
			</header>
			<div className="flex flex-1 overflow-hidden">
				<nav className="flex flex-col gap-2 py-[1rem] px-[2rem]">
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
				<ScrollArea className="flex-1 p-10">
					<Outlet />
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	)
}

export default CustomLayout
