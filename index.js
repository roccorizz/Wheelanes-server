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


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwzl4ri.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        console.log(err)
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
        const usersCollection = client.db('Wheelanes').collection('users');

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }



        //jwt

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const matchedUser = await usersCollection.findOne(user)
            if (matchedUser) {
                const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '20d' });
                res.json({ user: matchedUser, token })
            }
            else {
                res.send('User not found')
            }

        })

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

            res.send(cars)
        })


        app.get('/allcars', verifyJWT, async (req, res) => {
            const query = { seller: req.decoded.email };
            const cursor = carCollection.find(query);
            const cars = await cursor.toArray();
            res.send(cars);
        })

        app.put('/allcars/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isFeatured: true

                }
            }
            const result = await carCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.delete('/allcars/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await carCollection.deleteOne(filter);
            res.send(result);
        })
        app.get('/allcars/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { category_id: parseInt(id) };
            const cars = carCollection.find(query);
            const cursor = await cars.toArray()
            res.send(cursor);
        })
        app.post('/allcars', async (req, res) => {
            const car = req.body;
            const result = await carCollection.insertOne(car);
            res.send(result);
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
            const query = { carCategory: id };
            const cars = carCollection.find(query);
            const cursor = await cars.toArray()
            res.send(cursor);
        })
        app.get('/users', async (req, res) => {
            const role = req.query.role
            const users = await usersCollection.find({ role: role }).toArray();
            res.send(users);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const users = await usersCollection.deleteOne(id);
            res.send(users);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

        app.post('/users/seller', async (req, res) => {
            const seller = req.body;
            const result = await usersCollection.insertOne(seller);
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user)
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'

                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.put('/users/seller/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'seller'

                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const carId = req.body.car_id
            const query = {

                email: booking.email,

            }
            await bookingCollection.insertOne(booking);

            const id = { _id: ObjectId(carId) }

            const updated = await carCollection.updateOne(id, {
                $set: {
                    isFeatured: false,
                    status: 'Sold'

                }
            })

            res.send(updated);
        });

    }
    finally {

    }

}
run().catch(err => console.error(err))


app.get('/', (req, res) => {
    res.send('wheelanes server is running');
})

app.listen(port, () => console.log(`wheelens running on ${port}`))