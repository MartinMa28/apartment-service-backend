import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { MongoClient } from 'mongodb';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 7000;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// create the MongoDB connection pool before the app runs
MongoClient.connect('mongodb://localhost:27018', {
  useUnifiedTopology: true,
})
  .then((client) => {
    app.locals.db = client.db('apartment_database');
    app.listen(PORT, () => console.log(`Listening on port ${PORT} ...`));
  })
  .catch((err) => console.log(err));
