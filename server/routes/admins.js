import express from "express";
import {auth, db} from "../database.js";
import {Timestamp} from "firebase-admin/firestore";

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

adminsRouter.post('/', async (req, res) => {
	const {email, password, full_name, mobile_number} = req.body

	try {

		// check if user already exists
		const existingUser = await auth.getUserByEmail(email).catch(() => null)

		if (existingUser) {
			return res.status(400).json({error: 'User already exists'})
		}

		const user = await auth.createUser({
			email: email,
			password: password
		})

		await db.collection('admins').doc(user.uid).set({
			full_name: full_name,
			mobile_number: mobile_number,
			created_at: Timestamp.now(),
			deleted_at: null
		})

		return res.json(user)
	} catch (error) {
		return res.status(400).json({error: error.message})
	}
})

adminsRouter.post('/:id', async (req, res) => {
	const {full_name, mobile_number} = req.body
	const id = req.params.id

	try {
		await db.runTransaction(async (transaction) => {
			const adminRef = db.collection('admins').doc(id)
			const admin = await transaction.get(adminRef)

			if (!admin.exists) {
				return res.status(404).json({error: 'Admin not found'})
			}

			await transaction.update(adminRef, {
				full_name: full_name,
				mobile_number: mobile_number
			})
		})

		return res.json({message: 'Admin updated successfully'})
	} catch (error) {
		return res.status(400).json({error: error.message})
	}
})
