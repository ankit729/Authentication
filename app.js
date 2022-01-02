require("dotenv").config();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const express = require("express");
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.route("/")
    .get(function(req, res) {
        res.render("home");
    });

app.route("/auth/google")
    .get(passport.authenticate("google", { scope: ["profile"] })
    );

app.route("/auth/google/secrets")
    .get(passport.authenticate("google", { failureRedirect: "/login" }), function(req, res) {
        res.redirect("/secrets");
    });

app.route("/login")
    .get(function(req, res) {
        res.render("login");
    })
    
    .post(passport.authenticate("local", { failureRedirect: "/login" }), function(req, res) {
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
            User.find({"secret": {$ne: null}}, function(err, foundUsers) {
                if(err){
                    console.log(err);
                }
                else{
                    res.render("secrets", { users: foundUsers });
                }
            });
        }
        else{
            res.redirect("/login");
        }
    });

app.route("/submit")
    .get(function(req, res) {
        if(req.isAuthenticated()){
            res.render("submit");
        }
        else{
            res.redirect("/login");
        }
    })
    
    .post(function(req, res) {
        const secret = req.body.secret;
        User.findById(req.user.id, function(err, foundUser) {
            if(err){
                console.log(err);
            }
            else if(foundUser){
                foundUser.secret = secret;
                foundUser.save(function(err) {
                    if(err){
                        console.log(err);
                    }
                    res.redirect("/secrets");
                });
            }
        });
    });


app.listen(3000, function() {
    console.log("Server has started successfully.");
});