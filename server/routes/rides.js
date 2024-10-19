import express from "express";
import {auth, db} from "../database.js";

export const ridesRouter = express.Router({mergeParams: true})

ridesRouter.get('/', async (req, res) => {
	const rides = await db.collection('rides').get()
	const ridesArray = []

	await Promise.all(rides.docs.map(async (doc) => {
		const id = doc.id
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
		const sosResponderData = doc.data().sos.responded_by ? await db.collection('users').doc(doc.data().sos.responded_by).get().then(async (doc) => {
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

		const sosResponderCarData = doc.data().sos.car ? await db.collection('cars').doc(doc.data().sos.car).get().then((doc) => {
			return {
				id: doc.id,
				...doc.data()
			}
		}) : null

		ridesArray.push({
			id: id,
			...doc.data(),
			passengersData,
			driverData,
			sosResponderData,
			driverCarData,
			sosResponderCarData
		})
	}))

	return res.json(ridesArray)
})