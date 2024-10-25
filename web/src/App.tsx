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
import Rides from './pages/Rides.tsx'
import { fetchCampusLocation, refreshRide, refreshRides } from './api/rides.tsx'
import Ride from './pages/Ride.tsx'
import { APIProvider } from '@vis.gl/react-google-maps'
import RealtimeMap from './pages/RealtimeMap.tsx'
import Cars from './pages/Cars.tsx'
import { refreshCars } from './api/cars.ts'
import { PrimeReactProvider } from 'primereact/api'

const App = () => {
	console.log('App')
	
	return (
		<div className="flex w-full h-full">
			<PrimeReactProvider>
				<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
					<AuthProvider>
						<Routes />
					</AuthProvider>
				</APIProvider>
			</PrimeReactProvider>
		</div>
	)
}

const Routes = () => {
	const { user, loading } = useContext(AuthContext)
	
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
						path: '/map',
						element: <RealtimeMap />,
						loader: async () => {
							return {
								campusLocation: await fetchCampusLocation({
									address: 'INTI International College Penang',
								}).then((location) => {
									console.log(location)
									return location
								}).catch((error) => {
									console.error(error)
									return null
								}),
							}
						},
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
					{
						path: '/rides',
						element: <Rides />,
						loader: refreshRides,
					},
					{
						path: '/rides/:id',
						element: <Ride />,
						loader: async ({ params }) => {
							return {
								ride: await refreshRide(params.id || '', (ride) => {
									console.log(ride)
									return ride
								}),
								campusLocation: await fetchCampusLocation({
									address: 'INTI International College Penang',
								}).then((location) => {
									console.log(location)
									return location
								}).catch((error) => {
									console.error(error)
									return null
								}),
							}
						},
					},
					{
						path: '/cars',
						element: <Cars />,
						loader: refreshCars,
					},
				] as RouteObject[],
			},
		] as RouteObject[]
	}, [])
	
	const router = useMemo(() => {
		return createBrowserRouter(user ? authenticatedRoutes : unauthenticatedRoutes)
	}, [authenticatedRoutes, user, unauthenticatedRoutes])
	
	return (
		loading ? <h1>Loading...</h1> :
			<RouterProvider router={router} />
	)
}

export default App
