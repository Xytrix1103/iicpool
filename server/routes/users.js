import express from "express";
import {auth, db} from "../database.js";

export const usersRouter = express.Router({mergeParams: true})

usersRouter.get('/', async (req, res) => {
	const users = await db.collection('users').get()
	const usersArray = []

	await Promise.all(users.docs.map(async (doc) => {
		const id = doc.id

		const authUser = await auth.getUser(id)

		usersArray.push({
			id: id,
			email: authUser.email,
			provider_data: authUser.providerData.map((provider) => provider.providerId),
			...doc.data()
		})
	}))

	return res.json(usersArray)
})
