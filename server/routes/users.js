import express from "express";
import {auth, db} from "../database.js";
import {Timestamp} from "firebase-admin/firestore";

export const usersRouter = express.Router({mergeParams: true})

usersRouter.get('/', async (req, res) => {
	const users = await db.collection('users').where('deleted_at', '==', null).get()
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

usersRouter.post('/', async (req, res) => {
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

		await db.collection('users').doc(user.uid).set({
			full_name: full_name,
			mobile_number: mobile_number,
			roles: ["passenger"],
			deleted_at: null,
			created_at: Timestamp.now(),
			notificationSettings: {
				messages: false,
				ride_updates: false
			}
		})

		return res.json(user)
	} catch (error) {
		return res.status(400).json({error: error.message})
	}
})

usersRouter.post('/:id', async (req, res) => {
	const {id} = req.params
	const {full_name, mobile_number} = req.body
	console.log(full_name, mobile_number)

	try {
		await db.runTransaction(async (transaction) => {
			const userRef = db.collection('users').doc(id)
			const userDoc = await transaction.get(userRef)

			if (!userDoc.exists) {
				return res.status(404).json({error: 'User not found'})
			}

			transaction.update(userRef, {
				full_name: full_name,
				mobile_number: mobile_number,
			})
		})

		return res.json({message: 'User updated successfully'})
	} catch (error) {
		return res.status(400).json({error: error.message})
	}
})

usersRouter.post('/:id/updateEmail', async (req, res) => {
	const {id} = req.params
	const {email} = req.body

	try {
		await auth.updateUser(id, {
			email: email
		})

		return res.json({message: 'Email updated successfully'})
	} catch (error) {
		return res.status(400).json({error: error.message})
	}
})

usersRouter.post('/:id/updatePassword', async (req, res) => {
	const {id} = req.params
	const {password} = req.body

	try {
		await auth.updateUser(id, {
			password: password
		})

		return res.json({message: 'Password updated successfully'})
	} catch (error) {
		return res.status(400).json({error: error.message})
	}
})

