const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const app = express();
const bcrypt = require('bcryptjs');
const bcryptjs = require("bcryptjs");
const { generateRandomString, findUserByEmail, urlsForUser} = require('./helper'); //helper functions used in app.

const PORT = 8080;
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "A128"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "3209"
  }
};
const userDatabase = {
  "A128": {
    id: "A128",
    email: "elliot@gmail.com",
    password: "555"
  },
  "3209": {
    id: "3209",
    email: "aman@gmail.com",
    password: "123"
  }
};

app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'UserId',
  keys: ["great save luongo"]
}));
app.use(bodyParser.urlencoded({extended: true}));

//HTTP ROUTES
app.get('/', (req, res) => {
  const cookieID = req.session.UserId;
  if (!cookieID) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const cookieID = req.session.UserId;
  const userURLS = urlsForUser(cookieID, urlDatabase);
  
  if (!cookieID) {
    res.status(401);
  }

  const templateVars = {urls: userURLS, userObj: userDatabase[cookieID], cookieID };
  res.render('pages/urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const cookieID = req.session.UserId;
  const templateVars = { userObj: userDatabase[cookieID] };

  if (!cookieID) {
    return res.status(401).redirect("/login");
  }

  res.render('pages/urls_new', templateVars);
});

app.post('/urls', (req,res) => {
  const cookieID = req.session.UserId;
  const longURL = req.body.longURL;

  if (!cookieID) {
    return res.status(401).send("You are not a member. Please login or register to create a tiny URL.");
  }

  if (!longURL) {
    return res.status(403).send("Please do not leave URL fields blank.");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: cookieID};
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/:shortURL', (req, res) => {
  const cookieID = req.session.UserId;
  const shortURL = req.params.shortURL;
  const shortURLObj = urlDatabase[shortURL];
  
  if (urlDatabase[shortURL] === undefined) {
    return res.status(404).send(`ERROR. ShortURL ID ${shortURL} does not exist.`);
  }

  if (!cookieID) {
    res.status(401);
  }

  if (cookieID !== shortURLObj["userID"]) {
    res.status(401);
  }
  
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]['longURL'], userObj: userDatabase[cookieID], cookieID, shortURLObj };
  res.render('pages/urls_show', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const cookieID = req.session.UserId;
  const shortURLObj = urlDatabase[shortURL];

  if (!cookieID) {
    return res.status(401).send("You are not a member. Please log in or register in order to delete tiny URL's.");
  }

  if (cookieID !== shortURLObj["userID"]) {
    return res.status(401).send("You do not have access to delete other users URL's.");
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  const shortURLObj = urlDatabase[shortURL];
  const cookieID = req.session.UserId;

  if (!updatedURL) {
    return res.status(403).send("Please do not leave URL fields blank.");
  }

  if (!cookieID) {
    return res.status(401).send("You are not logged in. Please log in to make edits to tiny URLS.");
  }

  if (cookieID !== shortURLObj["userID"]) {
    return res.status(401).send("You do not have access to edit other users URLs.");
  }

  urlDatabase[shortURL]['longURL'] = updatedURL;
  res.redirect('/urls');
});

app.post('/login', (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const currentUser = findUserByEmail(email, userDatabase);
  
  if (!currentUser) {
    return res.status(403).send("Email or password is incorrect. Please try again or register an account.");
  }

  if (currentUser["email"] === email) {
    bcrypt.compare(password, currentUser["password"]) //ASYNC HASHING PASSWORD CHECK VIA PROMISES
      .then((result) => {
        if (result) {
          req.session.UserId = currentUser["id"];
          res.redirect('/urls');
        } else {
          return res.status(403).send("Email or password is incorrect. Please try again or register an account.");
        }
      });
  }
});

app.get('/login', (req, res) => {
  const cookieID = req.session.UserId;
  const templateVars = {userObj: userDatabase[cookieID] };

  if (cookieID) {
    return res.redirect('/urls');
  }

  res.render('pages/urls_login', templateVars);
});

app.post('/logout', (req,res) => {
  res.clearCookie('UserId');
  res.redirect('/urls');
});

app.get('/register', (req,res) => {
  const cookieID = req.session.UserId;
  const templateVars = {userObj: userDatabase[cookieID]};

  if (cookieID) {
    return res.redirect('/urls');
  }

  res.render('pages/urls_registration', templateVars);
});

app.post('/register', (req,res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please do not leave email or password fields blank.");
  }

  if (findUserByEmail(email, userDatabase)) {
    return res.status(400).send("This account already exists. Please try again.");
  }

  bcrypt.genSalt(10) //ASYNC PASSWORD HASHING VIA PROMISES
    .then(function(salt) {
      return bcrypt.hash(password, salt);
    })
    .then(function(resultHash) {
      userDatabase[id] = {
        id,
        email,
        password: resultHash
      };
      req.session.UserId = id;
      res.redirect('/urls');
    });
});

app.get('/u/:shortURL', (req, res) => { //route to handle redirect links to longURL's
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`ERROR. Webpage does not exist.`);
  }
  
  const longURL = urlDatabase[shortURL]["longURL"];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});