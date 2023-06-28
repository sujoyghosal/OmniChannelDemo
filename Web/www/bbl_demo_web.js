var express = require("express");
var app = express();
var path = require("path");
//var https = require("https");
var http = require("http");
const fs = require("fs");
const bodyParser = require("body-parser");
var helmet = require("helmet");
app.use(helmet());
app.use(express.static("www"));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/www/Login.html"));
  //__dirname : It will resolve to your project folder.
});

var PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(
    "To view your app, open this link in your browser: http://localhost:" + PORT
  );
});
