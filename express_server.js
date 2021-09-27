const express = require("express");
const app = express();
const PORT = 8791; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => { // resgisters a handler on the root path
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => { //adds additional end points to our example_app. This one sends a json object
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => { //sends html code over through http. notice the <b> tag, the browser will pick up on this and bold the word world
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});