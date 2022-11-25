const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
let jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();


//middleware
app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
    res.send('wheelanes server is running');
})


const uri = "mongodb+srv://DB_USER:DB_PASSWORD@cluster0.mwzl4ri.mongodb.net/?retryWrites=true&w=majority";
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
        const featuredCarsCollection = client.db('Wheelanes').collection('featuredcars');
        const usersCollection = client.db('Wheelanes').collection('users');


        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '7D' });
            res.send({ token })
            console.log({ token })
        })
        //get 6 featured cars
        app.get('/featuredcars', async (req, res) => {
            const query = {};
            const limit = 6;
            const cursor = featuredCarsCollection.find(query).limit(limit);
            const cars = await cursor.toArray();
            res.send(cars);

        })
        //get 6 cars
        app.get('/cars', async (req, res) => {
            const query = {};
            const limit = 6;
            const cursor = carCollection.find(query).limit(limit);
            const cars = await cursor.toArray();
            res.send(cars);

        })
        //add new featured car
        app.post('/services', async (req, res) => {
            const car = req.body;
            const result = await featuredCarsCollection.insertOne(car);
            res.send(result);
        })
        //add new car
        app.post('/cars', async (req, res) => {
            const car = req.body;
            const result = await carCollection.insertOne(car);
            res.send(result);
        })
        //get all featured cars
        app.get('/all-featuredcars', async (req, res) => {
            const query = {};
            const cursor = featuredCarsCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
        })
        //get all cars
        app.get('/all-cars', async (req, res) => {
            const query = {};
            const cursor = carCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
        })
        //get single featured car
        app.get('/featuredcar/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await featuredCarsCollection.findOne(query);
            res.send(result);
        })
        //get single featured car
        app.get('/car/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await carCollection.findOne(query);
            res.send(result);
        })


    }
    finally {

    }

}
run().catch(err => console.error(err))
app.listen(port, () => console.log(`wheelens running on ${port}`))