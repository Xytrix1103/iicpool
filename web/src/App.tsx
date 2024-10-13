import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router-dom'
import Login from './pages/Login.tsx'
import { AuthProvider } from './components/providers/AuthProvider.tsx'
import { AuthContext } from './components/contexts/AuthContext.tsx'
import { useContext, useMemo } from 'react'
import CustomLayout from './components/layout/CustomLayout.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Users from './pages/Users.tsx'
import { refreshUsers } from './api/users.ts'
import Admins from './pages/Admins.tsx'
import { refreshAdmins } from './api/admins.ts'

const App = () => {
	console.log('App')
	
	return (
		<div className="flex w-full h-full">
			<AuthProvider>
				<Routes />
			</AuthProvider>
		</div>
	)
}

const Routes = () => {
	const { profile, loading } = useContext(AuthContext)
	
	const unauthenticatedRoutes = useMemo(() => {
		return [
			{
				path: '/',
				element: <Login />,
			},
		] as RouteObject[]
	}, [])
	
	const authenticatedRoutes = useMemo(() => {
		return [
			{
				path: '/',
				element: <CustomLayout />,
				children: [
					{
						path: '/',
						element: <Dashboard />,
					},
					{
						path: '/users',
						element: <Users />,
						loader: refreshUsers,
					},
					{
						path: '/admins',
						element: <Admins />,
						loader: refreshAdmins,
					},
				] as RouteObject[],
			},
		] as RouteObject[]
	}, [])
	
	const router = useMemo(() => {
		return createBrowserRouter(profile ? authenticatedRoutes : unauthenticatedRoutes)
	}, [authenticatedRoutes, profile, unauthenticatedRoutes])
	
	return (
		loading ? <h1>Loading...</h1> :
			<RouterProvider router={router} />
	)
}

export default App
