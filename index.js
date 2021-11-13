const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const express = require('express')
require('dotenv').config()
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())
// Backend Server Start Prot
const port = process.env.PORT || 8080
// ID No Find
const objectId = require('mongodb').ObjectId
// Token Config
const serviceAccount = JSON.parse(process.env.FIREBASE_ACCOUNT_SERVICES);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
async function verifyToken(req, res, next) {
    if(req.headers?.authorization?.startsWith('Bearer ')){
        const userToken = req.headers.authorization.split(' ')[1]
        try{
            const decodedUser = await admin.auth().verifyIdToken(userToken)
            req.decodedUserEmail = decodedUser.email
        }catch (e) {
        }
    }
    next()
}


// Database Information
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@kundol.cbpbf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// Database Connect Function Declaration
async function kundolDb (){
    try{
        await client.connect()
        const database = client.db('kundolDb')
        const collectionProducts = database.collection('products')
        const collectionReviews = database.collection('reviews')
        const collectionOrder = database.collection('orders')
        const collectionUsers = database.collection('users')
        /* GET API Methods Declaration Below */
        // Get API
        app.get('/api/shop/products', async (req,res)=>{
            const allProducts = await collectionProducts.find({})
            const result = await allProducts.toArray()
            await res.json(result)
        })
        // Get API
        app.get('/api/products', async (req,res)=>{
            const allProducts = await collectionProducts.find({})
            const result = await allProducts.limit(6).toArray()
            await res.json(result)
        })
        // Get One Product by ID
        app.get('/api/details/products/:id', async (req,res)=>{
            const id = req.params.id;
            const query = {_id: objectId(id)}
            const result = await collectionProducts.findOne(query)
            await res.json(result)
        })
        //Get API For Review
        app.get('/user/reviews', async (req,res)=>{
            const allReviews = await collectionReviews.find({})
            const result = await allReviews.toArray()
            await res.json(result)
        })
        // GET API For Customer Wise
        app.get('/api/user/orders/:email', async (req, res)=>{
            const email = req.params.email
            console.log('Email: ', email)
            const query = {userEmail: email}
            const getData = await collectionOrder.find(query)
            const result = await getData.toArray()
           await res.json(result)
        })
        // GET API All Order
        app.get('/api/all-orders', async (req,res)=>{
            const allOrder = await collectionOrder.find({})
            const result = await allOrder.toArray()
            await res.json(result)
        })
        // GET API All Users
        app.get('/api/all-users', async (req,res)=>{
            const allUser = await collectionUsers.find({role: 0})
            const result = await allUser.toArray()
            await res.json(result)
        })
        app.get('/api/user/admin/:email', async (req,res) =>{
            const email = req.params.email
            const query = {email: email}
            const result = await collectionUsers.findOne(query)
            let isAdmin = false
            if(result?.role === 1 ){
                isAdmin = true
            }
            await res.json({admin: isAdmin})
        })

        /* POST Methods Declaration Below */

        // Orders POST API
        app.post('/api/product/orders', async (req,res)=>{
            const newOrder = req.body
            const result  = await collectionOrder.insertOne(newOrder)
            await res.json(result)
        })
        // Product POST API
        app.post('/api/product/add', async (req,res)=>{
            const newProduct = req.body
            const result = await  collectionProducts.insertOne(newProduct)
            await res.json(result)
        })
        // Review POST API
        app.post('/api/review/add', async (req,res)=>{
            const newReview = req.body
            const result = await collectionReviews.insertOne(newReview)
            await res.json(result)
        })
        // New User Post API
        app.post('/api/new-user-info', async (req,res)=>{
            const newUser = req.body
            const result = await collectionUsers.insertOne(newUser)
            await res.json(result)
        })
        // Order Status Change
        app.put('/api/order/status/:id', verifyToken, async (req, res)=>{
            const id = req.params.id
            const requester = req.decodedUserEmail
            if(requester){
                const filter = {_id: objectId(id)}
                const updateDoc = {$set: {status: 1 }}
                const result = await collectionOrder.updateOne(filter,updateDoc)
                await res.json(result)
            }else{
                res.send(403).json({message: 'You can not change order status'})
            }
        })
        // Make Admin User
        app.put('/api/make-admin-user/:id',verifyToken, async (req,res)=>{
            const id = req.params.id
            const requester = req.decodedUserEmail
            if(requester){
                const requesterAccount = await collectionUsers.findOne({email: requester})
                if(requesterAccount.role === 1){
                    const query = {_id: objectId(id)}
                    const updateDoc = {$set: {role: 1}}
                    const result = await collectionUsers.updateOne(query,updateDoc)
                    await res.json(result)
                }
            }else{
                res.send(403).json({message: 'You can not create admin'})
            }

        })
        /* DELETE Methods Declaration */
        app.delete('/api/order/remove/:id', async (req,res)=>{
            const id = req.params.id
            const query = {_id: objectId(id)}
            const result = await collectionOrder.deleteOne(query)
            await res.json(result)
        })
        app.delete('/api/product/remove/:id', async (req,res)=>{
            const id = req.params.id
            const query = {_id: objectId(id)}
            const result = await collectionProducts.deleteOne(query)
            await res.json(result)
        })
    }finally {

    }
}
kundolDb().catch(console.dir)


// client.connect(err => {
//     const collection = client.db("test").collection("devices");
//     // perform actions on the collection object
//     client.close();
// });



//Test API GET
app.get('/', async (req,res)=>{
    await res.send('Backend Server Start')
})

app.listen(port, () =>{
    console.log(`'Backend Server Start at http://localhost:${port}`)
})
