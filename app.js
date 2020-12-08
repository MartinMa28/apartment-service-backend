import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { MongoClient, ObjectId } from 'mongodb';
import indexRouter from './routes/index';
import usersRouter from './routes/users';
import authRouter from './routes/auth';
import dotenv from 'dotenv';
import passport from 'passport';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { Strategy as LocalStrategy } from 'passport-local';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 7000;

app.use(logger('dev'));
app.use(express.json());
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

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/auth', authRouter);

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
MongoClient.connect('mongodb://localhost:27018', {
  useUnifiedTopology: true,
})
  .then((client) => {
    app.locals.db = client.db('apartment_database');
    app.listen(PORT, () => console.log(`Listening on port ${PORT} ...`));
  })
  .catch((err) => console.log(err));
