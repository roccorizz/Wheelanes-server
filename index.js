const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
let jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();


//middleware
app.use(cors())
app.use(express.json());

console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwzl4ri.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}
async function run() {
    try {
        const carCollection = client.db('Wheelanes').collection('cars');
        // const usersCollection = client.db('Wheelanes').collection('users');
        //jwt

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
            res.send({ token })
            console.log({ token })
        })
        //get 6 featured cars
        app.get('/featured-cars', async (req, res) => {
            const query = { isFeatured: true };
            const limit = 6;
            const cursor = carCollection.find(query).limit(limit);
            const cars = await cursor.toArray();
            res.send(cars);

        })
        app.get('/featured-cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cars = await carCollection.findOne(query);

            res.send(cars);
            console.log(cars)
        })


        // //get cars by category
        // app.get('/cars-bodytype', async (req, res) => {
        //     const query = {
        //         [
        //         { $group: { bodyType: "$bodyType" } }
        //         ]};
        //     const cursor = carCollection.aggregate(query);

        //     const cars = await cursor.toArray();
        //     res.send(cars);
        // })

        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cars = await carCollection.findOne(query);

            res.send(cars);
            console.log(cars)
        })
        // //add new featured car
        // app.post('/services', async (req, res) => {
        //     const car = req.body;
        //     const result = await featuredCarsCollection.insertOne(car);
        //     res.send(result);
        // })
        // //add new car
        // app.post('/cars', async (req, res) => {
        //     const car = req.body;
        //     const result = await carCollection.insertOne(car);
        //     res.send(result);
        // })
        // //get all featured cars
        // app.get('/all-featuredcars', async (req, res) => {
        //     const query = {};
        //     const cursor = featuredCarsCollection.find(query);
        //     const cars = await cursor.toArray();
        //     res.send(cars);
        // })
        // //get all cars
        // app.get('/all-cars', async (req, res) => {
        //     const query = {};
        //     const cursor = carCollection.find(query);
        //     const cars = await cursor.toArray();
        //     res.send(cars);
        // })
        // //get single featured car
        // app.get('/featuredcar/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await featuredCarsCollection.findOne(query);
        //     res.send(result);
        // })
        // //get single featured car
        // app.get('/car/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await carCollection.findOne(query);
        //     res.send(result);
        // })

        // //********* User Section *********** */

        // //    get users from database

        // app.get('/orders', verifyJWT, async (req, res) => {
        //     const email = req.query.email;
        //     const decodedEmail = req.decoded.email;
        //     if (email !== decodedEmail) {
        //         return res.send(403).send({ message: 'forbidden access' })
        //     }
        //     const query = { email: email };
        //     const bookings = await bookingCollection.find(query).toArray();
        //     res.send(bookings);
        // })


        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query);
        //     res.send({ isAdmin: user?.role === 'admin' });
        // })
        // /************ add a new user in database */
        // app.post('/users', async (req, res) => {
        //     const user = req.body;
        //     console.log(user);
        //     const result = await usersCollection.insertOne(user);
        //     res.send(result);
        // });
    }
    finally {

    }

}
run().catch(err => console.error(err))


app.get('/', (req, res) => {
    res.send('wheelanes server is running');
})

app.listen(port, () => console.log(`wheelens running on ${port}`))