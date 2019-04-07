const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');

// Load User Model
const User = require('../../model/User');

// @route   GET api/users/test
// @desc    Tests users route
// @access  Public
router.get('/test', (req, res) => res.json({msg: "Users Works"}));

// @route   GET api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
    // check if user hasn't been taken
    User.findOne({ email: req.body.email })
        .then( user => {
          if(user){
              return res.status(400).json({ email: 'Email already exists.' });
          } else {

              // construct avatar
              const avatar = gravatar.url(req.body.email, {
                  s: '200',  // size
                  r: 'pg',  // rating
                  d: 'mm'   // default - showing no profile image
              });

              // proceed to create user
              const newUser = new User({
                  name: req.body.name,
                  email: req.body.email,
                  avatar,
                  password: req.body.password
              });

              bcrypt.genSalt(10, (err, salt) => { // if we get salt create hash
                  // hash password
                  bcrypt.hash(newUser.password, salt, (err, hash) => { // if no error, it will give hash
                      if(err) throw err;
                      newUser.password = hash;
                      newUser.save()    // returns promise
                          .then(user => {
                             res.json(user);
                          })
                          .catch(err => console.error(err));
                  });
              });
          }
        })
});

// @route   GET api/users/login
// @desc    Login user / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Find the user by email
    User.findOne({ email })
        .then( user => {
            // check user
            if(!user){
                return res.status(404).json({email: "User not found."});
            }

            // check password - plain pwd
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    // User matched
                    if(isMatch){
                        // create JWT payload
                        const payload = {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar
                        };
                        // Sign token -> payload - include in token; secret - expiration date
                        jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
                            res.json({
                                success: true,
                                token: 'Bearer ' + token
                            });
                        });

                    } else {
                        return res.status(400).json({password: "Password incorrect"});
                    }
                })
        })
});

module.exports = router;