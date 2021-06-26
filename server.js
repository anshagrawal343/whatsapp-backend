// Importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// App-Config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
    appId: "1219740",
    key: "f85dee62b3c265cc7e67",
    secret: "bc0ca03aff01a51da7e3",
    cluster: "ap2",
    useTLS: true
});

// Middleware
app.use(express.json());
app.use(cors());

// DB-Config
const connection_url = 'mongodb+srv://admin:admin@cluster0.olvoo.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.once('open', () => {
    console.log("Database connected!");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    changeStream.on("change", (change) => {
        console.log(change);
        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                message: messageDetails.message,
                name: messageDetails.name,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        }
        else {
            console.log("Error triggering pusher");
        }
    });
});

// ???

// API Routes
app.get('/', (req, res) => {
    res.status(200).send("Hello World");
});
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(201).send(data);
        }
    });
});
app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(data);
        }
    });
});

// Listener
app.listen(port, () => {
    console.log(`Listening on localhost:${port}`);
});