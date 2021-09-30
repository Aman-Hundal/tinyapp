const express = require("express");
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcryptjs');
const bcryptjs = require("bcryptjs");
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

const generateRandomString = function() { //add a letter and number as the first two elements of the string. use same methodology as below
  let shortURL = "";
  let count = 0;
  const encryptionSet = [0,1,2,3,4,5,6,7,8,9, "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  while (count < 6) {
    let randIndex = Math.floor(Math.random() * (62 - 0) + 0);
    shortURL += encryptionSet[randIndex];
    count++;
  }
  return shortURL;
};
const findUserBy = function(property, reference) {  //allows you to find a user in your database (if they exist reutnr true) if not return false
  for (let key in userDatabase ) {
    if(userDatabase[key][property] === reference) {
      return userDatabase[key];
    }
  }
  return false;
}; // MAKING THIS CODE MODULAR and ONE THAT CAN ADDRESS MULTIPLE PROBLEMS WAS HUGE. WE CAN HUSE THIS FUNCION IN ALL OF OUR LOGIN. REIGSTRATION AND OTHER CHECKS
//  When we take common functionality and extract it into a standalone function, we can use that functionality in several places (like our login and register routes) while only having to write it once.
const urlsForUser = function(userId) {
  filteredObj = {};
  for(keys in urlDatabase) {
    if(userId === urlDatabase[keys]["userID"]) {
      filteredObj[keys] = urlDatabase[keys];
    }
  }
  return filteredObj;
};

app.set('view engine', 'ejs'); // to set EJS as the templating engine for the file.

app.use(cookieSession({
  name: 'UserId',
  keys: ["great save luongo"]
}));

// app.use(cookieParser()); // allows you to Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(bodyParser.urlencoded({extended: true})); //middleware that will convert the request body from a buffer into a string/JS Object. it will then add the data to the req object under the key body. This will take the form data from the req.obj that i sent via post in the urls_new page and convert it into human language and not buffer language making it easy to find longURl to add to your DB.

app.get('/urls', (req, res) => {
  const cookieID = req.session.UserId;
  const userURLS = urlsForUser(cookieID)
  
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

  if(!cookieID) {
    return res.status(401).redirect("/login");
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
    return res.status(401).redirect("/login");
  }

  if (cookieID !== shortURLObj["userID"]) {
    return res.status(401).send("You do not have access to delete other users URLs.");
  }

  delete urlDatabase[shortURL];
  console.log(urlDatabase)
  res.redirect('/urls');
});

app.post('/urls/:shortURL/edit', (req, res) => { //route that waits for a request from the /edits page. This code picks up the request, takes in the shortURL realted to the request, picks up the req objects body info (which is created with the input elements name attrivute) whch is a new url and then changes the short url to the new longurl using object notation.
  const shortURL = req.params.shortURL;
  const updatedURL = req.body.updatedURL;
  const shortURLObj = urlDatabase[shortURL];
  const cookieID = req.session.UserId;

  if(!cookieID) {
    return res.status(401).redirect("/login");
  }

  if (cookieID !== shortURLObj["userID"]) {
    return res.status(401).send("You do not have access to delete other users URLs.");
  }

  urlDatabase[shortURL]['longURL'] = updatedURL;
  console.log(urlDatabase)
  res.redirect('/urls');
});

app.post('/login', (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const currentUser = findUserBy("email",email);
  
  if(!currentUser) {
    return res.status(403).send("Emaill cannot be found. Please try again.");
  }

  // console.log("current_user:", currentUser);

  if(currentUser["email"] === email) {
    bcrypt.compare(password, currentUser["password"])
    .then((result) => {
      if(result) {
        req.session.UserId = currentUser["id"];
        res.redirect('/urls');
      } else {
        return res.status(403).send("Password entered is incorrect. Please try again");
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
  res.render('pages/urls_login', templateVars);
});

app.post('/logout', (req,res) => {
  res.clearCookie('UserId');
  res.redirect('/urls');
});

app.get('/register', (req,res) => {
  const cookieID = req.session.UserId;
  const templateVars = {userObj: userDatabase[cookieID]};
  res.render('pages/urls_registration', templateVars);
});

app.post('/register', (req,res) => { //adding a POST route to access a newly registered user (see get route above) and their email and password. Then genrate an id and add the user to our userdatabase
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password) {
    return res.status(400).send("Please do not leave fields blank");
  }

  if(findUserBy("email", email)) { 
    return res.status(400).send("This account already exists");
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
  });
  
  req.session.UserId = id;
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => { //new route to handle redirect links to longURL's
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`ERROR. Page does not exist.`);
  }
  
  const longURL = urlDatabase[shortURL]["longURL"];
  res.redirect(longURL);
  //when the browser receives a redirection repsonse it does another GET request to the url in the response (in this case the long URL and above to the other url pages we created)
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

//ORDER ROUTES FROM MOST TO LEAST SPECIFIC

// TO DO: 
//review project evlauation and add in more feautres.
//FINAL FUNCTION CHECK FOR BUGS
//CSS
//code clean up code/order routes