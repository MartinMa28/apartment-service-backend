import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import logger from 'morgan';
import { MongoClient, ObjectId } from 'mongodb';
import indexRouter from './routes/index';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import housesRouter from './routes/houses';
import watchRouter from './routes/watch';
import eventsRouter from './routes/events';
import emailsRouter from './routes/emails';
import dotenv from 'dotenv';
import passport from 'passport';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { Strategy as LocalStrategy } from 'passport-local';
import Queue from 'bull';
import findAndNotifySavedUsers from './utils/notificationService';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 7000;

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// clients pool for real-time http sse notifications
app.locals.clients = [];

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/auth', authRouter);
app.use('/houses', housesRouter);
app.use('/watch', watchRouter);
app.use('/events', eventsRouter);
app.use('/email', emailsRouter);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// =========== passport configs ===========
// local verify strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await app.locals.db
          .collection('user')
          .findOne({ email: email });

        if (user === null) {
          return done(null, false, { message: 'Incorrect email address.' });
        }

        if (await bcrypt.compare(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect password.' });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// User serializer and deserializer
passport.serializeUser(async (user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  const user = await app.locals.db.collection('user').findOne({
    _id: ObjectId(id),
  });

  return done(null, user);
});
// =========== passport configs ===========

// Create the MongoDB connection pool before the app runs
MongoClient.connect(
  'mongodb://mongo-1:27017,mongo-2:27017,mongo-3:27017/?replicaSet=apartmentRepl',
  {
    useUnifiedTopology: true,
  }
)
  .then((client) => {
    app.locals.db = client.db('apartment_database');
    app.listen(PORT, () => console.log(`Listening on port ${PORT} ...`));

    // MongoDB change stream notification
    const changeStream = app.locals.db.collection('apartment').watch();

    changeStream.on('change', (change) => {
      findAndNotifySavedUsers(
        app.locals.db,
        change['documentKey']['_id'].toString(),
        change['updateDescription']['updatedFields']['result-price'],
        app.locals.clients
      );
    });

    // Email notification
    const mailNotificationQueue = new Queue('mailNotification', {
      redis: {
        host: 'redis',
        port: 6379,
      },
    });

    mailNotificationQueue.process(async (job) => {
      console.log('email job is completed');
      console.log(job.data.userId);
      for (let i = 0; i < app.locals.clients.length; i++) {
        console.log(app.locals.clients[i].userId);
        if (app.locals.clients[i].userId === job.data.userId) {
          console.log('Found the user client');
          app.locals.clients[i].res.write(
            `data: ${JSON.stringify({
              message: job.data.message,
              email: true,
            })}\n\n`
          );
        }
        break;
      }
    });
  })
  .catch((err) => console.log(err));
