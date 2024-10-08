import express from 'express'

const app = express()
let port = 3000

app.get('/', (req, res) => {
	res.send('Hello World!')
})

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
