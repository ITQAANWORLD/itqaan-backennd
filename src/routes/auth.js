require('dotenv').config()
const express = require('express')
const Joi = require('joi')
const bycrpt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../models/dbconfig');
const fetchUser = require('../models/user');

const router = express.Router();

router.post('/login', (req,res) => {
    const schema = Joi.object().keys({
        email : Joi.string().email().required().min(3).max(150),
        password : Joi.string().required().min(8).max(100),
    });
    const data = req.body;
    
    const joiResult = schema.validate(data);
    if(joiResult.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid request : " + joiResult.error.details[0].message
           });
    } else {
        
        pool.getConnection((err,connection) => {
            if(err) throw err;
            connection.query('SELECT * FROM users WHERE email = ? order by id desc limit 1', [joiResult.value.email] , (error,rows) => {
                if(error) throw error;

                connection.release();
                if(rows.length > 0) {
                    let user = rows[0];
                     bycrpt.compare(joiResult.value.password, user.password, (err, isMatch) => {
                        if(isMatch) {
                            delete user.password
                            delete user.rememberToken
                            delete user.deletedDate
                            delete user.updatedDate
                            
                            const accessToken = generateAccessToken(user)
                            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN)
                            return res.json({
                                "status" : "Success",
                                "message" : "log successful"  ,
                                "accessToken" : accessToken,
                                "refreshToken" : refreshToken
                               });
                        } else {
                            return res.json({
                                "status" : "Error",
                                "message" : "Invalid email or password. ",
                               });
                        }
                     });
                    
                } else {
                    return res.json({
                        "status" : "Error",
                        "message" : "Invalid email or password ",
                       });
                }
                
            })
        });
        
    }
    
});

router.post('/register', (req,res) => {
    const schema = Joi.object().keys({
        firstName : Joi.string().required().min(2).max(150),
        middleName : Joi.string().required().min(2).max(150),
        lastName : Joi.string().required().min(2).max(150),
        email : Joi.string().email().required().min(3).max(150),
        phoneNumber : Joi.string().required().min(2).max(150),
        password : Joi.string().required().min(8).max(100),
    });
    const data = req.body;
    
    const joiResult = schema.validate(data);
    if(joiResult.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid " + joiResult.error.details[0].message
           });
    } else {

        //  const user = fetchUser(['firstName','email'],'users','WHERE email = ?',[joiResult.value.email]);
        // // console.log(user)
        // if(user.status) {
        //     return res.status(400).json({
        //         "status" : "Error",
        //         "message" : "Invalid " + user
        //        });
        // }

        bycrpt.hash(joiResult.value.password,11, (err,hash) => {
            pool.getConnection((err,connection) => {
                if(err) throw err;
                // TODO : Check if email is unique

                connection.query('INSERT INTO users(firstName, middleName,lastName,email,phoneNumber,password) \
                VALUES(?,?,?,?,?,?) ', [joiResult.value.firstName,joiResult.value.middleName,joiResult.value.lastName,joiResult.value.email,
                    joiResult.value.phoneNumber,hash] , (error,rows) => {
                    if(error) throw error;
                    //console.log('Successfully fetched data ',rows[0]["name"])
                    
            
                    connection.release();

                    return res.json({
                        "status" : "Success",
                        "message" : "User created " + rows.insertId,
                        "records" : rows
                    });
                })
            });
        })
    }
});

router.post('/forgotPassword', (req,res) => {
    const schema = Joi.object().keys({
        email : Joi.string().email().required().min(3).max(150),
    });
    const data = req.body;
    
    const joiResult = schema.validate(data);
    if(joiResult.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid " + joiResult.error.details[0].message
           });
    } else {
        return res.json({
            "status" : "Success",
            "message" : "forgot password " + joiResult.value.email
           });
    }
});

router.post('/logout', authenticateToken,(req,res) => {
    //+ req.value.email
    return res.json({
        "status" : "Success",
        "message" : "You are logged out of itqaan " 
       });
       
});

router.post('/profile', authenticateToken,(req,res) => {
    const user = fetchUser([],'users','WHERE id = ?',[req.user.id]);
         console.log(user)
            
            if(user) {
                return res.status(400).json({
                    "status" : "Error",
                    "message" : "Invalid " 
                });
            } else {
                return res.json({
                    "status" : "Success",
                    "message" : "Successfully fetched " ,
                    "data" : user
                });
            }
    
});

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '30m'})
}

function authenticateToken(req,res,next) {
    const authHeader = req.headers['authorization']
    const authToken = authHeader && authHeader.split(' ')[1]
    if(authToken == null) return res.sendStatus(401)

    jwt.verify(authToken,process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

module.exports = router;