import express from "express";
import {db} from "../database.js";

export const carsRouter = express.Router({mergeParams: true})

carsRouter.get('/', async (req, res) => {
	const cars = await db.collection('cars').get()
	const carsArray = []

	await Promise.all(cars.docs.map(async (doc) => {
		const id = doc.id

		const ownerData = await db.collection('users').doc(doc.data().owner).get().then((doc) => {
			return {
				id: doc.id,
				...doc.data()
			}
		})

		carsArray.push({
			id: id,
			ownerData,
			...doc.data()
		})
	}))

	return res.json(carsArray)
})