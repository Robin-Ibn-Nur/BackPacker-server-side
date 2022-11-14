const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();


// middleware
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.h290xzo.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// jwt function
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('travel').collection('services');
        const reviewerCollection = client.db('travel').collection('reviewer')

        // using jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);

        });

        // add service
        app.post('/service', async (req, res) => {
            const addService = req.body
            console.log(addService)
            const result = await serviceCollection.insertOne(addService);
            console.log(result)
            res.send(result);
        })


        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        // reviewers api
        app.get('/reviewer', async (req, res) => {

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = reviewerCollection.find(query).sort({ _id: -1 });
            const reviewer = await cursor.toArray();
            res.send(reviewer);
        })

        // some add service implement
        app.post('/reviewer', async (req, res) => {
            const reviewer = req.body;
            const result = await reviewerCollection.insertOne(reviewer);
            res.send(result);
        });

        // send data to update 
        app.get('/reviewer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewerCollection.findOne(query)
            res.send(result)
        })

        // update user message
        app.put('/reviewer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const oldMessage = req.body;
            const options = { upsert: true };
            const updatedMessage = {
                $set: {
                    message: oldMessage.message
                }
            }
            const result = await reviewerCollection.updateOne(filter, updatedMessage, options);
            res.send(result)
        })


        // delete option

        app.delete('/reviewer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewerCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(error => console.log(error));




app.get('/', (req, res) => {
    res.send('server is running')
});


app.listen(port, () => {
    console.log(`server site runnig on ${port}`)
})