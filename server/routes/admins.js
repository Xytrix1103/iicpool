import express from "express";
import {auth, db} from "../database.js";

export const adminsRouter = express.Router({mergeParams: true})

adminsRouter.get('/', async (req, res) => {
	const admins = await db.collection('admins').get()
	const adminsArray = []

	await Promise.all(admins.docs.map(async (doc) => {
		const uid = doc.id

		const authUser = await auth.getUser(uid)

		adminsArray.push({
			uid: uid,
			email: authUser.email,
			...doc.data()
		})
	}))

	return res.json(adminsArray)
})
