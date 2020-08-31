import Express from 'express';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import axios from 'axios';
import pkg from 'passport-vkontakte';

const { Strategy: VKontakteStrategy } = pkg;
const app = new Express();
const logger = morgan('combined');

app.use(logger);
app.set('view engine', 'pug');
app.use(Express.static('assets'));

const VKONTAKTE_APP_ID = '7582587';
const VKONTAKTE_APP_SECRET = 'KNqKK8AIPYOr5dQvw7yn';

passport.use(new VKontakteStrategy({
  clientID: VKONTAKTE_APP_ID,
  clientSecret: VKONTAKTE_APP_SECRET,
  callbackURL: "https://pure-fjord-51923.herokuapp.com/auth/vkontakte/callback",
  scope: ['friends'],
  profileFields: ['photo_100']
},
  function verify(accessToken, refreshToken, params, profile, done) {
    const user = {
      ...profile,
      accessToken
    };
    return done(null, user);
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  if (req.user) {
    axios.get('https://api.vk.com/method/friends.search?count=5&fields=photo_100,online,city,country,education&order=random&access_token=' + req.user.accessToken + '&v=5.64',)
      .then((data) => {
        // res.send(JSON.stringify(data.data))
        console.log(req.user);
        res.render('index', { data: data.data.response.items, user: req.user });
      })
  } else {
    res.render('index', { user: req.user });
  }
});

app.get('/auth/vkontakte',
  passport.authenticate('vkontakte'),
  function (req, res) {
    // The request will be redirected to vk.com for authentication, so
    // this function will not be called.
  });

app.get('/auth/vkontakte/callback',
  passport.authenticate('vkontakte', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log('Example app listening on port 3000!');
});