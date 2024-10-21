import express from "express";
import {auth, db} from "../database.js";
import {Timestamp} from "firebase-admin/firestore";

export const ridesRouter = express.Router({mergeParams: true})

Timestamp.prototype.toJSON = function () {
	return this.toDate().toISOString();
};

ridesRouter.get('/', async (req, res) => {
	const rides = await db.collection('rides').orderBy('datetime', 'desc').get()
	const ridesArray = []

	await Promise.all(rides.docs.map(async (doc) => {
		const id = doc.id
		const data = doc.data()
		const passengersData = await Promise.all(doc.data().passengers.map(async (passenger) => {
			const passengerUser = await auth.getUser(passenger)
			const passengerData = await db.collection('users').doc(passenger).get()
			return {
				id: passenger,
				email: passengerUser.email,
				...passengerData.data()
			}
		}))
		const driverData = await db.collection('users').doc(doc.data().driver).get().then(async (doc) => {
			const driverUser = await auth.getUser(doc.id)
			return {
				id: doc.id,
				email: driverUser.email,
				...doc.data()
			}
		})
		const sosResponderData = doc.data()?.sos?.responded_by ? await db.collection('users').doc(doc.data().sos.responded_by).get().then(async (doc) => {
			const sosResponderUser = await auth.getUser(doc.id)
			return {
				id: doc.id,
				email: sosResponderUser.email,
				...doc.data()
			}
		}) : null

		const driverCarData = await db.collection('cars').doc(doc.data().car).get().then((doc) => {
			return {
				id: doc.id,
				...doc.data()
			}
		})

		const sosResponderCarData = doc.data()?.sos?.car ? await db.collection('cars').doc(doc.data().sos.car).get().then((doc) => {
			return {
				id: doc.id,
				...doc.data()
			}
		}) : null

		ridesArray.push({
			id: id,
			...data,
			datetime: Timestamp.fromDate(data.datetime.toDate()),
			passengersData,
			driverData,
			sosResponderData,
			driverCarData,
			sosResponderCarData
		})
	}))

	return res.json(ridesArray)
})

ridesRouter.get('/:id', async (req, res) => {
	const {id} = req.params
	const ride = await db.collection('rides').doc(id).get()
	const data = ride.data()
	const passengersData = await Promise.all(ride.data().passengers.map(async (passenger) => {
		const passengerUser = await auth.getUser(passenger)
		const passengerData = await db.collection('users').doc(passenger).get()
		return {
			id: passenger,
			email: passengerUser.email,
			...passengerData.data()
		}
	}))

	const driverData = await db.collection('users').doc(ride.data().driver).get().then(async (doc) => {
		const driverUser = await auth.getUser(doc.id)
		return {
			id: doc.id,
			email: driverUser.email,
			...doc.data()
		}
	})
	const sosResponderData = ride.data()?.sos?.responded_by ? await db.collection('users').doc(ride.data().sos.responded_by).get().then(async (doc) => {
		const sosResponderUser = await auth.getUser(doc.id)
		return {
			id: doc.id,
			email: sosResponderUser.email,
			...doc.data()
		}
	}) : null

	const driverCarData = await db.collection('cars').doc(ride.data().car).get().then((doc) => {
		return {
			id: doc.id,
			...doc.data()
		}
	})

	const sosResponderCarData = ride.data()?.sos?.car ? await db.collection('cars').doc(ride.data().sos.car).get().then((doc) => {
		return {
			id: doc.id,
			...doc.data()
		}
	}) : null

	return res.json({
		id: id,
		...data,
		datetime: Timestamp.fromDate(data.datetime.toDate()),
		passengersData,
		driverData,
		sosResponderData,
		driverCarData,
		sosResponderCarData
	})
})

ridesRouter.post('/location', async (req, res) => {
	const {address} = req.body;
	const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;

	try {
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();

		if (data.results && data.results.length > 0) {
			return res.json(data.results[0]);
		} else {
			console.error('Error fetching address:', data);
			return res.status(500).json({error: 'Error fetching address'});
		}
	} catch (error) {
		console.error('Error fetching address:', error);
		return res.status(500).json({error: 'Error fetching address'});
	}
});

ridesRouter.post('/directions', async (req, res) => {
	const {origin, destination, departure_time, waypoints} = req.body;
	const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

	const departureTimeInSeconds = departure_time ? Math.floor(new Date(departure_time).getTime() / 1000) : undefined;
	const params = `origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving${departureTimeInSeconds ? `&departure_time=${departureTimeInSeconds}` : ''}${waypoints && waypoints.length > 0 ? `&waypoints=${waypoints.map(waypoint => `${waypoint.lat},${waypoint.lng}`).join('|')}` : ''}`;

	const url = `${baseUrl}?${params}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;

	try {
		const result = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const data = await result.json();

		if (data.routes && data.routes.length > 0) {
			return res.json(data);
		} else {
			console.error('Error fetching directions:', data);
			return res.status(500).json({error: 'Error fetching directions'});
		}
	} catch (error) {
		console.error('Error fetching directions:', error);
		return res.status(500).json({error: 'Error fetching directions'});
	}
});
