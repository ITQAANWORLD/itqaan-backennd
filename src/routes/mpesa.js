require('dotenv').config();
const express = require('express')
const Joi = require('joi')
const Mpesa = require('mpesa-api').Mpesa
const unirest = require('unirest')
const crypto = require("crypto");

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
    unirest
        .get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg=='})
        .send({ "grant_type": "client_credentials" })
        .then((response) => {
            console.log(response.body)
        })
});

router.post('/confirmation',(req,res) => {
    //var unirest = require("unirest");
    let request = unirest("GET", "https://sandbox.safaricom.co.ke/oauth/v1/generate");
    
    request.query({
     "grant_type": "client_credentials"
    });
    
    request.headers({
     "Authorization": "Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg===="
    });
    
    request.end(res => {
     if (res.error) throw new Error(res.error);
     console.log(res.body);
    });
    
});

router.post('/request2',(req,res) => {
    let str = Buffer.from(['174379', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919','20230712165627'])
    let b = str.toString('base64')
    console.log('Base 64:'+b)
    unirest
        .post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg=='})
        .send({    
            "BusinessShortCode": "174379",    
            "Password": ""+b+"",    
            "Timestamp":"20230712165627",    
            "TransactionType": "CustomerBuyGoodsOnline",    
            "Amount": "1",    
            "PartyA":"254708111325",    
            "PartyB":"174379",    
            "PhoneNumber":"254708111325",    
            "CallBackURL": "http://itqaan.world/api/mpesa/confirmation",    
            "AccountReference":"Test",    
            "TransactionDesc":"Test"
         })
        .then((response) => {
            console.log(response.body)
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