const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = { //used to keep track of all the urls and their shortened forms. This is the data we ll want to show on the urls page.Keys look auto generated and the values are the long urls
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set('view engine', 'ejs'); // to set EJS as the templating engine for the file.

app.get("/", (req, res) => { // resgisters a handler on the root path
  res.send("Hello!");
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase}; // When sending variables to an EJS template, we need to send them inside an object, even if we are only sending one variable. This is so we can use the key of that variable (in the above case the key is urls) to access the data within our template.
  res.render('pages/urls_index', templateVars); // this passes the urldatabase object data to our urls_index ESJ Temaplte. This will link the two data pieces
});

app.get("/urls.json", (req, res) => { //adds additional end points/routes to our example_app. This one sends a json object
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});