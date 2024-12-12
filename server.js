<<<<<<< HEAD
import express  from 'express'
import cookieParser from 'cookie-parser'
import cors  from 'cors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { logger } from './services/logger.service.js'
logger.info('server.js loaded...')

const app = express()

// Express App Config
app.use(cookieParser())
app.use(express.json())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
    // Express serve static files on production environment
    app.use(express.static(path.resolve(__dirname, 'public')))
    console.log('__dirname: ', __dirname)
} else {
    // Configuring CORS
    // Make sure origin contains the url 
    // your frontend dev-server is running on
    const corsOptions = {
        origin: [
            'http://127.0.0.1:5173', 
            'http://localhost:5173',

            'http://127.0.0.1:3000', 
            'http://localhost:3000',
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { toyRoutes } from './api/toy/toy.routes.js'

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/toy', toyRoutes)

// Make every unmatched server-side-route fall back to index.html
// So when requesting http://localhost:3030/index.html/toy/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow vue-router to take it from there

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030

app.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})
=======
import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import { toyService } from './services/toy.service.js'
import { userService } from './services/user.service.js'
import { loggerService } from './services/logger.service.js'

const app = express()

// Express Config:
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
    ],
    credentials: true,
}
app.use(cors(corsOptions))

// Express Routing:

// REST API for Toys
app.get('/api/toy', async (req, res) => {
    try {
        const filterBy = {
            txt: req.query.txt || '',
            createdAt: +req.query.createdAt || 0,
            price: +req.query.price || 0,
            isInStock: req.query.isInStock || '',
            labels: req.query.labels || [],
            sortBy: req.query.sortBy,
            pageIdx: req.query.pageIdx || undefined,
        }
        const toys = await toyService.query(filterBy)
        res.send(toys)
    } catch (err) {
        loggerService.error('Cannot get toys', err)
        res.status(400).send('Cannot get toys')
    }
})

app.get('/api/toy/:toyId', async (req, res) => {
    try {
        const { toyId } = req.params
        const toy = await toyService.getById(toyId)
        res.send(toy)
    } catch (err) {
        loggerService.error('Cannot get toy', err)
        res.status(400).send('Cannot get toy')
    }
})

app.post('/api/toy', async (req, res) => {
    try {
        const loggedinUser = userService.validateToken(req.cookies.loginToken)
        if (!loggedinUser) return res.status(401).send('Cannot add toy')

        const toy = {
            name: req.body.name,
            price: +req.body.price,
            createdAt: +req.body.createdAt || Date.now(),
            inStock: req.body.inStock || null,
            labels: req.body.labels || [],
        }
        const savedToy = await toyService.save(toy, loggedinUser)
        res.send(savedToy)
    } catch (err) {
        loggerService.error('Cannot save toy', err)
        res.status(400).send('Cannot save toy')
    }
})

app.put('/api/toy/:id', async (req, res) => {
    try {
        const loggedinUser = userService.validateToken(req.cookies.loginToken)
        if (!loggedinUser) return res.status(401).send('Cannot update toy')

        const toy = {
            name: req.body.name,
            price: +req.body.price,
            createdAt: +req.body.createdAt || Date.now(),
            inStock: req.body.inStock ?? true,
            labels: req.body.labels || [],
        }
        const savedToy = await toyService.save(toy, loggedinUser)
        res.send(savedToy)
    } catch (err) {
        loggerService.error('Cannot save toy', err)
        res.status(400).send('Cannot save toy')
    }
})


app.delete('/api/toy/:toyId', async (req, res) => {
    try {
        const loggedinUser = userService.validateToken(req.cookies.loginToken)
        if (!loggedinUser) return res.status(401).send('Cannot remove toy')

        const { toyId } = req.params
        await toyService.remove(toyId, loggedinUser)
        res.send('Removed!')
    } catch (err) {
        loggerService.error('Cannot remove toy', err)
        res.status(400).send('Cannot remove toy')
    }
})

// User API
app.get('/api/user', async (req, res) => {
    try {
        const users = await userService.query()
        res.send(users)
    } catch (err) {
        loggerService.error('Cannot load users', err)
        res.status(400).send('Cannot load users')
    }
})

app.get('/api/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        const user = await userService.getById(userId)
        res.send(user)
    } catch (err) {
        loggerService.error('Cannot load user', err)
        res.status(400).send('Cannot load user')
    }
})

// Auth API
app.post('/api/auth/login', async (req, res) => {
    try {
        const credentials = req.body
        const user = await userService.checkLogin(credentials)
        if (user) {
            const loginToken = userService.getLoginToken(user)
            res.cookie('loginToken', loginToken)
            res.send(user)
        } else {
            res.status(401).send('Invalid Credentials')
        }
    } catch (err) {
        loggerService.error('Login error', err)
        res.status(500).send('Login error')
    }
})

app.post('/api/auth/signup', async (req, res) => {
    try {
        const credentials = req.body
        const user = await userService.save(credentials)
        if (user) {
            const loginToken = userService.getLoginToken(user)
            res.cookie('loginToken', loginToken)
            res.send(user)
        } else {
            res.status(400).send('Cannot signup')
        }
    } catch (err) {
        loggerService.error('Signup error', err)
        res.status(500).send('Signup error')
    }
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})

app.put('/api/user', async (req, res) => {
    try {
        const loggedinUser = userService.validateToken(req.cookies.loginToken)
        if (!loggedinUser) return res.status(400).send('No logged in user')

        const { diff } = req.body
        if (loggedinUser.score + diff < 0) return res.status(400).send('No credit')

        loggedinUser.score += diff
        const user = await userService.save(loggedinUser)
        const token = userService.getLoginToken(user)
        res.cookie('loginToken', token)
        res.send(user)
    } catch (err) {
        loggerService.error('Cannot update user score', err)
        res.status(500).send('Cannot update user score')
    }
})

// Fallback route
app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

const PORT = process.env.PORT || 3030
app.listen(PORT, () =>
    loggerService.info(`Server listening on port http://127.0.0.1:${PORT}/`)
)
>>>>>>> origin/main
