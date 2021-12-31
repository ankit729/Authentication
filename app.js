require("dotenv").config();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const express = require("express");
const md5 = require("md5");
const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = new mongoose.model("User", userSchema);

app.route("/")
    .get(function(req, res) {
        res.render("home");
    });

app.route("/login")
    .get(function(req, res) {
        res.render("login");
    })
    
    .post(function(req, res) {
        const email = req.body.email;
        const password = md5(req.body.password);

        User.findOne({email: email, password: password}, function(err, foundUser) {
            if(err){
                console.log(err);
            }
            else if(foundUser){
                res.render("secrets");
            }
            else{
                res.render("login");
            }
        });
    });

app.route("/register")
    .get(function(req, res) {
        res.render("register");
    })

    .post(function(req, res) {
        const email = req.body.email;
        const password = md5(req.body.password);

        const user = new User({
            email: email,
            password: password
        });
        user.save(function(err) {
            if(err){
                console.log(err);
            }
            else{
                res.render("secrets");
            }
        });
    });



app.listen(3000, function() {
    console.log("Server has started successfully.");
});