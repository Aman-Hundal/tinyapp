//imports
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const app = express();
const bcrypt = require('bcryptjs');
const bcryptjs = require("bcryptjs");
const { generateRandomString, findUserByEmail, urlsForUser} = require('./helper'); //helper functions used in app.

//const global variables
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

//middleware and EJS engine setup
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'UserId',
  keys: ["great save luongo"]
}));
app.use(bodyParser.urlencoded({extended: true}));

//HTTP ROUTES

// GET route to root page. Will redirect to urls page if use is logged in or login page if user is not logged in.
app.get('/', (req, res) => {
  const cookieID = req.session.UserId;
  if (!cookieID) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

// GET route to main urls index page. Page shows users their owned shortened urls in a table format. Filter function (urlsForUser) is used to only display urls that are assigned/owned by the logged in user.
app.get('/urls', (req, res) => {
  const cookieID = req.session.UserId;
  const userURLS = urlsForUser(cookieID, urlDatabase);
  
  if (!cookieID) {
    res.status(401);
  }

  const templateVars = {urls: userURLS, userObj: userDatabase[cookieID], cookieID };
  res.render('pages/urls_index', templateVars);
});

//New url shorten page. Shows a user an interface to create a new shortened url.
app.get('/urls/new', (req, res) => {
  const cookieID = req.session.UserId;
  const templateVars = { userObj: userDatabase[cookieID] };

  if (!cookieID) {
    return res.status(401).redirect("/login");
  }

  res.render('pages/urls_new', templateVars);
});

// POST route which takes a request from the urls/new (shorten url) page. Once the request is recieved, a random id is generated for the short Url and the short url, long url and user id of the creator is added as an object to the url database.
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

//Displays a single/specific short url. Users are provided an interface where they can select the short url to be transferred to the coresponding long url page/website. Additionally users are provided an interface where they can edit their owned shorturls to another website.
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

//POST route which takes a request from the main urls index page. If a user selects the delete button on the urls index page, this route takes the requests shortUrl, finds that shorturl object in the urldatabase and deletes the shorturl. Users whom do not own the short url cannot delete it nor can non-logged in users.
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

//POST route which takes an edit request from the single/specific urls page. The request finds the shortURL associated with the edit request in the urldatabase and changes only the longURL property of the shorturl object. Non logged in users and users whom do not own the shorturl cannot apply this request.
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

//POST route which takes a request from the login page. The route checks to see if the user exists in the user database (done by running a findUserbyemail function) then checks to see if the password is correct (using bcrypts compared function) and logs them to the urls index page if info is correct. Any blank boxes or email/password errors will respond with correct error messages.
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

//Displays the login page to the user. The user is displayed an interface to provide their login credentials. If the user is already logged in, this page will redirect to the urls index page.
app.get('/login', (req, res) => {
  const cookieID = req.session.UserId;
  const templateVars = {userObj: userDatabase[cookieID] };

  if (cookieID) {
    return res.redirect('/urls');
  }

  res.render('pages/urls_login', templateVars);
});

//POST route that takes in a request when a user chooses to logout. When the user logsout their session cookie is deleted and they are sent to the urls index page.
app.post('/logout', (req,res) => {
  res.clearCookie('UserId');
  res.redirect('/urls');
});

//Displays the registration page to the user. Users that are logged in are redirected to the urls index page.
app.get('/register', (req,res) => {
  const cookieID = req.session.UserId;
  const templateVars = {userObj: userDatabase[cookieID]};

  if (cookieID) {
    return res.redirect('/urls');
  }

  res.render('pages/urls_registration', templateVars);
});

//POST route which takes in a request from the register page/form. The route creates a random id using the generateRandomString function, and assigns an email and password (using bcrypts hashing function) to the userobject. The route checks to see if the user doesent already exist (if so they cannot register) and if this is true they are created as a user object under the userdatabase.
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

//Route to handle redirect links to longURL's on the single urls page.
app.get('/u/:shortURL', (req, res) => {
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