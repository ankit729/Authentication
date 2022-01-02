require("dotenv").config();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/")
    .get(function(req, res) {
        res.render("home");
    });

app.route("/login")
    .get(function(req, res) {
        res.render("login");
    })
    
    .post(passport.authenticate("local", {failureRedirect: "/login"}), function(req, res) {
        res.redirect("/secrets");
    });

app.route("/logout")
    .get(function(req, res) {
        req.logout();
        res.redirect("/");
    });

app.route("/register")
    .get(function(req, res) {
        res.render("register");
    })

    .post(function(req, res) {
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if(err){
                console.log(err);
                res.redirect("/register");
            }
            else{
                res.redirect("/login");
            }
        });
    });

app.route("/secrets")
    .get(function(req, res) {
        if(req.isAuthenticated()){
            res.render("secrets");
        }
        else{
            res.redirect("/login");
        }
    });

app.listen(3000, function() {
    console.log("Server has started successfully.");
});