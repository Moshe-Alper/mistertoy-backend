
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const toyService = {
    query,
    getById,
    remove,
    save
}

// const PAGE_SIZE = 5
const toys = utilService.readJsonFile('data/toy.json')

function query(filterBy = { txt: '' }) {
    const regex = new RegExp(filterBy.txt, 'i')
    var toysToReturn = toys.filter(toy => regex.test(toy.name))

    if (filterBy.price) {
        toysToReturn = toysToReturn.filter(toy => toy.price <= filterBy.price)
    }
    if (filterBy.createdAt) {
        toysToReturn = toysToReturn.filter(toy => toy.createdAt >= filterBy.createdAt)
    }

    if (filterBy.isInStock !== undefined && filterBy.isInStock !== '') {
        const isInStockBoolean = filterBy.isInStock === 'true'
        toysToReturn = toysToReturn.filter(toy => toy.inStock === isInStockBoolean)
    }

    if (filterBy.sort) {
        if (filterBy.sort === 'price') {
            toysToReturn = toysToReturn.sort((a, b) => a.price - b.price)
        } else if (filterBy.sort === 'createdAt') {
            toysToReturn = toysToReturn.sort((a, b) => a.createdAt - b.createdAt)
        }
        else if (filterBy.sort === 'txt') {
            toysToReturn = toysToReturn.sort((a, b) => a.name.localeCompare(b.name))
        }
    }

    return Promise.resolve(toysToReturn)
}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    return Promise.resolve(toy)
}

function remove(toyId, loggedinUser) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such Toy')

    const toy = toys[idx]
    if (!loggedinUser.isAdmin &&
        toy.owner._id !== loggedinUser._id) {
        return Promise.reject('Not your toy')
    }
    toys.splice(idx, 1)
    return _saveToysToFile()
}

function save(toy, loggedinUser) {
    if (toy._id) {
        const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
        if (!loggedinUser.isAdmin &&
            toyToUpdate.owner._id !== loggedinUser._id) {
            return Promise.reject('Not your toy')
        }
        toyToUpdate.name = toy.name
        toyToUpdate.updateAt = Date.now()
        toyToUpdate.createdAt = toy.createdAt
        toyToUpdate.price = toy.price
        toyToUpdate.inStock = toy.inStock
        toyToUpdate.labels = toy.inStock
        toy = toyToUpdate
    } else {
        toy._id = utilService.makeId()
        toy.owner = loggedinUser
        toys.push(toy)
    }
    delete toy.owner.score
    return _saveToysToFile().then(() => toy)
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 2)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}