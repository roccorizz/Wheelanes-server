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
        const categoryCollection = client.db('Wheelanes').collection('carCategories');
        const bookingCollection = client.db('Wheelanes').collection('bookings');
        const buyersCollection = client.db('Wheelanes').collection('buyers');
        const sellerCollection = client.db('Wheelanes').collection('sellers');
        const adminCollection = client.db('Wheelanes').collection('admin');

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await adminCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }


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


        app.get('/allcars', async (req, res) => {
            const query = {};
            const cursor = carCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
            console.log(cars)
        })

        //get cars by category

        app.get('/car-categories', async (req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);

        })

        app.get('/allcars/byCategory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: parseInt(id) };
            const cars = carCollection.find(query);
            const cursor = await cars.toArray()
            res.send(cursor);
        })


        app.get('/buyers', async (req, res) => {
            const query = {};
            const users = await buyersCollection.find(query).toArray();
            res.send(users);
        })
        app.get('/sellers', async (req, res) => {
            const query = {};
            const users = await sellerCollection.find(query).toArray();
            res.send(users);
        })
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await adminCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.post('/sellers', async (req, res) => {
            const seller = req.body;
            console.log(user);
            const result = await sellerCollection.insertOne(seller);
            res.send(result);
        });
        app.put('/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'

                }
            }
            const result = await adminCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

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