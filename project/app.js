const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const connectDB = require('./config/db');

//  load config
dotenv.config({ path: './config/config.env' });

//  Passport config
require('./config/passport')(passport);

connectDB();

const app = express();

//  add body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// add method override middleware
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

//  add logging with morgan middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// add helpers
const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs');

//  add view engine
app.engine('.hbs', exphbs({ 
  helpers: { 
    formatDate,
    stripTags,
    truncate,
    editIcon,
    select
  }, 
  defaultLayout: 'main', 
  extname: '.hbs'
}));
app.set('view engine', '.hbs');

//  add session middleware
app.use(session({
  secret: 'winning',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore( { mongooseConnection: mongoose.connection } )
}))

//  add passport middleware
app.use(passport.initialize());
app.use(passport.session());

//  set global variable
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
})

//  add static resources
app.use(express.static(path.join(__dirname, 'public')));

//  handle routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));