import express from "express";
import {auth, db} from "../database.js";

export const usersRouter = express.Router({mergeParams: true})

usersRouter.get('/', async (req, res) => {
	const users = await db.collection('users').get()
	const usersArray = []

	await Promise.all(users.docs.map(async (doc) => {
		const uid = doc.id

		const authUser = await auth.getUser(uid)

		usersArray.push({
			uid: uid,
			email: authUser.email,
			provider_data: authUser.providerData.map((provider) => provider.providerId),
			...doc.data()
		})
	}))

	return res.json(usersArray)
})
