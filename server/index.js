import express from 'express'
import {usersRouter} from "./routes/users.js";
import cors from 'cors'
import {adminsRouter} from "./routes/admins.js";
import {ridesRouter} from "./routes/rides.js";
import dotenv from "dotenv";
import {carsRouter} from "./routes/cars.js";

dotenv.config();

const app = express()
let port = 3000
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res) => {
	res.send('Hello World!')
})

app.use('/users', usersRouter)
app.use('/admins', adminsRouter)
app.use('/rides', ridesRouter)
app.use('/cars', carsRouter)

const startServer = (port) => {
	const server = app.listen(port, () => {
		console.log(`Example app listening on port ${port}`)
	})

	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			console.log(`Port ${port} is in use, trying port ${port + 1}`)
			startServer(port + 1)
		} else {
			console.error(err)
		}
	})
}

startServer(port)
