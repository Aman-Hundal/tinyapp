const express = require("express");
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const bcryptjs = require("bcryptjs");
const { generateRandomString, findUserByEmail, urlsForUser} = require('./helper');
const urlDatabase = {//used to keep track of all the urls and their shortened forms. This is the data we ll want to show on the urls page.Keys look auto generated and the values are the long urls
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
app.set('view engine', 'ejs'); // to set EJS as the templating engine for the file.

app.use(cookieSession({
  name: 'UserId',
  keys: ["great save luongo"]
}));
// app.use(cookieParser()); // allows you to Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(bodyParser.urlencoded({extended: true})); //middleware that will convert the request body from a buffer into a string/JS Object. it will then add the data to the req object under the key body. This will take the form data from the req.obj that i sent via post in the urls_new page and convert it into human language and not buffer language making it easy to find longURl to add to your DB.

app.get('/', (req, res) => {
  const cookieID = req.session.UserId;  
  if(!cookieID) {
    res.redirect('/login');
  }
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const cookieID = req.session.UserId;
  const userURLS = urlsForUser(cookieID, urlDatabase)
  
  if(!cookieID) {
    res.status(401);
  }

  const templateVars = {urls: userURLS, userObj: userDatabase[cookieID], cookieID }; // When sending variables to an EJS template, we need to send them inside an object, even if we are only sending one variable. This is so we can use the key of that variable (in the above case the key is urls) to access the data within our template.
  res.render('pages/urls_index', templateVars); // this passes the urldatabase object data to our urls_index ESJ Temaplte. This will link the two data pieces
});

app.get('/urls/new', (req, res) => { //creates a GET route to return/render the form page to the client/browser/user. This has to be before the :id route because routes go linearlly up and down. If this was below the :id url, any calls to this urls/new page will be handle by :id because express will think that new is a route param.
  const cookieID = req.session.UserId;
  const templateVars = { userObj: userDatabase[cookieID] };

  if(!cookieID) {
    return res.status(401).redirect("/login");
  };

  res.render('pages/urls_new', templateVars);
});

app.post('/urls', (req,res) => { //this will accept the post method/request from the url_new page and the form data it has to offer. This data (due the post method) will be sent in the body of the form/post request under the key longURL (name attribute in the input field). THe middleware makes the buffer lanugagre readable/into text and can take this data, acees the longUrl key and manipulate (add it to db, make a shortURL etc) to how we want using JS.
  const cookieID = req.session.UserId;
  const longURL = req.body.longURL;

  if(!cookieID) {
    return res.status(401).send("You are not a member. Please login or register to create a tiny URL.");
  }

  if(!longURL) {
    return res.status(403).send("Please do not leave URL fields blank.");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL]= {longURL: req.body.longURL, userID: cookieID};
  console.log(urlDatabase)
  res.redirect(`/urls/${shortURL}`); //add a redirect here -> string interpolate the shroturl to the end of our url so its /urls/shortUrl > then below will pick up on this.
}); 

app.get('/urls/:shortURL', (req, res) => { //the :shortURL makes the value after : a route parameter. This makes the value of this routeParam after : can be accessesd by the request (req) object using request.params.routeParam
  const cookieID = req.session.UserId;
  const shortURL = req.params.shortURL; //we can access the passed in url data after : as its stored in req.params.
  const shortURLObj = urlDatabase[shortURL];
  
  if(urlDatabase[shortURL] === undefined) {
    return res.status(404).send(`ERROR. ShortURL ID ${shortURL} does not exist.`);
  }

  if(!cookieID) {
    res.status(401);
  }

  if (cookieID !== shortURLObj["userID"]) {
    res.status(401);
  }
  
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]['longURL'], userObj: userDatabase[cookieID], cookieID, shortURLObj }; // we are pssing over the shortURL info from the passed in route param (:urldata) and then the longUrl using that same shortUrl to the urls_show template
  res.render('pages/urls_show', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => { //route that listens and responds to request for the /delete page. This code picks up the request, deletes the passed throuhgh URL  and redirects the person to main page.
  const shortURL = req.params.shortURL;
  const cookieID = req.session.UserId;
  const shortURLObj = urlDatabase[shortURL];

  if(!cookieID) {
    return res.status(401).send("You are not a member. Please log in or register in order to delete tiny URL's.")
  }

  if (cookieID !== shortURLObj["userID"]) {
    return res.status(401).send("You do not have access to delete other users URL's.");
  }

  delete urlDatabase[shortURL];
  console.log(urlDatabase)
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => { //route that waits for a request from the /edits page. This code picks up the request, takes in the shortURL realted to the request, picks up the req objects body info (which is created with the input elements name attrivute) whch is a new url and then changes the short url to the new longurl using object notation.
  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  const shortURLObj = urlDatabase[shortURL];
  const cookieID = req.session.UserId;

  if(!updatedURL) {
    return res.status(403).send("Please do not leave URL fields blank.");
  }

  if(!cookieID) {
    return res.status(401).send("You are not logged in. Please log in to make edits to tiny URLS.");
  }

  if (cookieID !== shortURLObj["userID"]) {
    return res.status(401).send("You do not have access to edit other users URLs.");
  }

  urlDatabase[shortURL]['longURL'] = updatedURL;
  console.log(urlDatabase)
  res.redirect('/urls');
});

app.post('/login', (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const currentUser = findUserByEmail(email, userDatabase);
  
  if(!currentUser) {
    return res.status(403).send("Email or password is incorrect. Please try again or register an account.");
  }

  // console.log("current_user:", currentUser);

  if(currentUser["email"] === email) {
    bcrypt.compare(password, currentUser["password"])
    .then((result) => {
      if(result) {
        req.session.UserId = currentUser["id"];
        res.redirect('/urls');
      } else {
        return res.status(403).send("Email or password is incorrect. Please try again or register an account.");
      }
    })
  };
  // if(currentUser["email"] === email && currentUser["password"] === password) {
  //   res.cookie("UserId", currentUser["id"]);
  // } else {
  //   return res.status(403).send("Password entered is incorrect. Please try again");
  // }
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

app.post('/register', (req,res) => { //adding a POST route to access a newly registered user (see get route above) and their email and password. Then genrate an id and add the user to our userdatabase
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password) {
    return res.status(400).send("Please do not leave email or password fields blank.");
  }

  console.log(userDatabase)
  console.log(email)
  if(findUserByEmail(email, userDatabase)) { 
    return res.status(400).send("This account already exists. Please try again.");
  };

  bcrypt.genSalt(10) //HASH ENCRYPTIN STEPP generate salt promise object
  .then(function(salt) { //pass in salt promise object to callback function in .then
    return bcrypt.hash(password, salt); // return hash promise object (by taking in salt promise obj result (10) and plaintext password above). and pass it to next then
  })
  .then(function(resultHash) { // take the rhash promise object from above, and unwrap its result (a hashed passowrd) into a new user object + pass in all the userdata generate above to the new user pbject
    userDatabase[id] = {
      id, //using ES6 logic to shorten property value notation
      email, //same as id
      password: resultHash //applying the result hash value returned from the .then and promises to the password proeprty for a user.
    };
    console.log("current DB:", userDatabase);
    req.session.UserId = id;
    res.redirect('/urls');
  });
});

app.get('/u/:shortURL', (req, res) => { //new route to handle redirect links to longURL's
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`ERROR. Webpage does not exist.`);
  }
  
  const longURL = urlDatabase[shortURL]["longURL"];
  res.redirect(longURL);
  //when the browser receives a redirection repsonse it does another GET request to the url in the response (in this case the long URL and above to the other url pages we created)
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

// TO DO: 
//code clean up code/order routes
//ORDER ROUTES FROM MOST TO LEAST SPECIFIC
//get routes in alphabetical then post in alpha


// cookies issue for not logign out but shutting down server
