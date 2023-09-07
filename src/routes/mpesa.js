require('dotenv').config();
const express = require('express')
const Joi = require('joi')
const Mpesa = require('mpesa-api').Mpesa
const unirest = require('unirest')
const crypto = require("crypto");
const logger = require("../common/logger")

const router = express.Router();

const environment = process.env.MPESA_ENVIRONMENT;

router.post('/request',(req,res) => {
    const schema = Joi.object().keys({
        phone_number : Joi.string().required().min(10).max(15),
        amount : Joi.number().required().min(10).max(100000),
    });
    const data = req.body;
    
    const joiResult = schema.validate(data);
    if(joiResult.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid " + joiResult.error.details[0].message
           });
    } 

    //const environment = process.env.MPESA_ENVIRONMENT;
    const credentials = {
        clientKey: process.env.MPESA_CONSUMER_KEY,
        clientSecret: process.env.MPESA_CONSUMER_SECRET,
        initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
       // securityCredential: process.env.MPESA_PASSKEY,
        certificatePath: 'mpesa_certificates/SandboxCertificate.cer'
    }
    const mpesa = new Mpesa(credentials,environment);

    mpesa.c2bSimulate({
            ShortCode: process.env.MPESA_SHORTCODE,
            Amount: joiResult.value.amount,
            Msisdn: joiResult.value.phone_number,
            CommandID: "CustomerPayBillOnline" ,
           // BillRefNumber: "Bill Reference Number" ,
        })
        .then((response) => {
                            
            console.log( "success :" + response);
            return res.json({
                "status" : "Success",
                "message" : "res " + response
               });
        })
        .catch((error) => {
            console.error(error);
            return res.json({
                "status" : "Error",
                "message" : "res " + error.statusCode + error.data.errorMessage
               });
        });
    
});

router.post('/register',(req,res) => {
    const schema = Joi.object().keys({
        phone_number : Joi.string().required().min(10).max(15),
        amount : Joi.number().required().min(10).max(100000),
    });
    const data = req.body;
    
    const joiResult = schema.validate(data);
    if(joiResult.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid " + joiResult.error.details[0].message
           });
    } 

    
    const credentials = {
        clientKey: process.env.MPESA_CONSUMER_KEY,
        clientSecret: process.env.MPESA_CONSUMER_SECRET,
        initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
       // securityCredential: process.env.MPESA_PASSKEY,
        certificatePath: 'mpesa_certificates/SandboxCertificate.cer'
    }
    const mpesa = new Mpesa(credentials,environment);

    mpesa.c2bRegister({
        ShortCode: process.env.MPESA_CONSUMER_KEY,
        ConfirmationURL: "Confirmation URL",
        ValidationURL: "Validation URL",
        ResponseType: "Cancelled", // `Completed` or `Cancelled`
      })
        .then((response) => {
                            
            console.log( "success :" + response);
            return res.json({
                "status" : "Success",
                "message" : "res " + response
               });
        })
        .catch((error) => {
            console.error(error);
            return res.json({
                "status" : "Error",
                "message" : "res " + error.statusCode + error.data.errorMessage
               });
        });
    
});

router.post('/validation',(req,res) => {
   
});

router.post('/confirmation',(req,res) => {
    
});

router.post('/stkcallback',(req,res) => {
    logger("STK CALLBACK " + req.body)
    res.json({
        ResultCode : 0,
        ResultDesc : "Accepted"
    })
});


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