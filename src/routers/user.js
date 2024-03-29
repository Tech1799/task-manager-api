const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')
const router = new express.Router()

// create a new user
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

// user login
router.post('/users/login', async(req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }catch(e){
        res.status(400).send()
    }
})

// fetch all users for particular user
router.get('/users/me', auth, async(req, res)=>{
    res.send(req.user)
})

// logging out a user
router.post('/users/logout', auth, async(req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch(e){
        res.status(500).send({})
    }
})

// logout all users
router.post('/users/logoutall', auth, async(req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e){
        res.status(500).send({})
    }
})


// fetch a user by using its id
router.get('/users/:id', async(req, res)=>{
    const _id = req.params.id
    try{
        const user = await User.findById(_id)

        if(!user){
            return res.status(404).send()
        }
        res.send(user)
    } catch(e){
        res.status(500).send(e)
    }
})

// updating user endpoints
router.patch('/users/me', auth, async(req, res)=>{
    const updates = Object.keys(req.body)
    const allowUpdates = ['name', 'age', 'password', 'email']
    const isValidOperation = updates.every((update)=> allowUpdates.includes(update))
    if(!isValidOperation){
        return res.status(400).send({error: 'invalid update'})
    }
    try{
        updates.forEach( (update)=> req.user[update] = req.body[update] )
        await req.user.save()
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        // if(!user){
        //     return res.status(404).send()
        // }
        res.send(req.user)
    } catch(e){
        res.status(400).send(e)
    }
})

// deleting user endpoints
router.delete('/users/me', auth, async(req, res)=>{
    try{
    await req.user.remove()
    sendCancelEmail(req.user.email, req.user.name)
    res.send(req.user)
    } catch(e){
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Plese upload an image.'))
        }
        cb(undefined, true)
    }
})

// uploading a profile picture
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send({message: 'uploaded successfully'})
}, (error, req, res, next)=>{
    res.status(400).send({error: error.message})
})

// deleting a profile picture
router.delete('/users/me/avatar', auth, async(req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send({message: "removed successfully."})
})

// fetching an image
router.get('/users/:id/avatar', async(req, res)=>{
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e){
        res.status(404).send()
    }
})

module.exports = router