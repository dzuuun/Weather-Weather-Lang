const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const cors = require('cors');

const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const morgan = require('morgan');

const mongoDBURI = require('./database/mongoDBConnection');
require('linqjs');

const userRoutes = require('./server/routes/userRoutes');
const sessionRoutes = require('./server/routes/sessionRoutes');
const weatherRoutes = require('./server/routes/weatherRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

// ** SERVER AND DATABASE CONNECTION ** //
mongoose
  .connect(mongoDBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('MongoDB Connected');

    app.listen(PORT, (error) => {
      if (error) throw error;
      console.log(`Server Running on http://localhost:${PORT}/`);
    });
  })
  .catch((error) => console.log(error));

const store = new MongoDBSession({
  uri: mongoDBURI,
  collection: 'sessions',
});

const limiter = rateLimit({
  windowMs: 1000,
  max: 1,
  message: 'Too many requests, try again later',
});

// ** MIDDLEWARES ** //
app.use(
  session({
    secret: 'WeatherWeatherLang',
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use(express.static('client'));
app.use(limiter);
app.use(connectLiveReload());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ** ROUTES ** //

app.use('/session', sessionRoutes);
app.use('/user', userRoutes);
app.use('/weather', weatherRoutes);
