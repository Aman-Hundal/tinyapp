const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080
const generateRandomString = function() {
  undefined
};

const urlDatabase = { //used to keep track of all the urls and their shortened forms. This is the data we ll want to show on the urls page.Keys look auto generated and the values are the long urls
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set('view engine', 'ejs'); // to set EJS as the templating engine for the file.

app.use(bodyParser.urlencoded({extended: true})); //middleware that will convert the request body from a buffer into a string/JS Object. it will then add the data to the req object under the key body. This will take the form data from the req.obj that i sent via post in the urls_new page and convert it into human language and not buffer language making it easy to find longURl to add to your DB.

app.get("/", (req, res) => { // resgisters a handler on the root path
  res.send("Hello!");
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase}; // When sending variables to an EJS template, we need to send them inside an object, even if we are only sending one variable. This is so we can use the key of that variable (in the above case the key is urls) to access the data within our template.
  res.render('pages/urls_index', templateVars); // this passes the urldatabase object data to our urls_index ESJ Temaplte. This will link the two data pieces
});

app.get('/urls/new', (req, res) => { //creates a GET route to return/render the form page to the client/browser/user. This has to be before the :id route because routes go linearlly up and down. If this was below the :id url, any calls to this urls/new page will be handle by :id because express will think that new is a route param.
  res.render('pages/urls_new');
});

app.post('/urls', (req,res) => { //this will accept the post method/request from the url_new page and the form data it has to offer. This data (due the post method) will be sent in the body of the form/post request under the key longURL (name attribute in the input field). THe middleware makes the buffer lanugagre readable/into text and can take this data, acees the longUrl key and manipulate (add it to db, make a shortURL etc) to how we want using JS.
  console.log(req.body);
  res.send("Thank you!");
}); 

app.get('/urls/:shortURL', (req, res) => { //the :shortURL makes the value after : a route parameter. This makes the value of this routeParam after : can be accessesd by the request (req) object using request.params.routeParam
  let shortURL = req.params.shortURL; //we can access the passed in url data after : as its stored in req.params. 
  const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL] }; // we are pssing over the shortURL info from the passed in route param (:urldata) and then the longUrl using that same shortUrl to the urls_show template
  res.render('pages/urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//ORDER ROUTES FROM MOST TO LEAST SPECIFIC