import express from "express";
import {auth, db} from "../database.js";

export const adminsRouter = express.Router({mergeParams: true})

adminsRouter.get('/', async (req, res) => {
	const admins = await db.collection('admins').get()
	const adminsArray = []

	await Promise.all(admins.docs.map(async (doc) => {
		const id = doc.id

		const authUser = await auth.getUser(id)

		adminsArray.push({
			id: id,
			email: authUser.email,
			...doc.data()
		})
	}))

	return res.json(adminsArray)
})

