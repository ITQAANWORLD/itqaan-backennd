require('dotenv').config();
const express = require('express')
const Joi = require('joi')
const Mpesa = require('mpesa-api').Mpesa
const unirest = require('unirest')
const crypto = require("crypto");


const environment = process.env.MPESA_ENVIRONMENT;

async function getToken() {
    let request = unirest("GET", "https://sandbox.safaricom.co.ke/oauth/v1/generate");
    
    request.query({
     "grant_type": "client_credentials"
    });
    
    request.headers({
     "Authorization": "Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg===="
    });
    
    request.end(res => {
         //if (res.error) throw new Error(res.error);
        if (res.error) console.log(res.error);
         console.log(res.body);
    });

    // unirest
    // .get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
    // .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg=='})
    // .send({ "grant_type": "client_credentials" })
    // .then((response) => {
    //     console.log(response.body)
    // })
}
async function stk_request(phoneNumber) {
    let str = Buffer.from(['174379', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919','20230712165627'])
    let base64String = str.toString('base64')
    console.log('Base 64:'+base64String)

    const STK_CALLBACK_URL = "https://https://139.84.233.34:3000/stkcallback";

    unirest
        .post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg=='})
        .send({    
            "BusinessShortCode": "174379",    
            "Password": base64String,    
            "Timestamp":"20230712165627",    
            "TransactionType": "CustomerBuyGoodsOnline",    
            "Amount": "1",    
            "PartyA":   phoneNumber,    
            "PartyB":   "174379",    
            "PhoneNumber": phoneNumber,    
            "CallBackURL": STK_CALLBACK_URL,    
            "AccountReference":"Test",    
            "TransactionDesc":"Test"
         })
        .then((response) => {
            console.log(response.body)
        })
    
}

async function saf_req(phoneNumber, amount) {
    const credentials = {
                    clientKey: process.env.MPESA_CONSUMER_KEY,
                    clientSecret: process.env.MPESA_CONSUMER_SECRET,
                    initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
                   // securityCredential: process.env.MPESA_PASSKEY,
                    certificatePath: '../../mpesa_certificates/SandboxCertificate.cer'
                }

    const mpesa = new Mpesa(credentials,process.env.MPESA_ENVIRONMENT);

    mpesa.c2bSimulate({
            ShortCode: process.env.MPESA_SHORTCODE,
            Amount: amount,
            Msisdn: phoneNumber,
            CommandID: "CustomerBuyGoodsOnline" , //CustomerPayBillOnline
            // BillRefNumber: "Bill Reference Number" ,
        })
        .then((response) => {
                            
            return {
                "status" : "Success",
                "message" : "res " + response
                };
        })
        .catch((error) => {
            console.error(error);
            return {
                "status" : "Error",
                "message" : "res " + error.statusCode + error.data.errorMessage
                };
        });
    
               

       
}

module.exports = saf_req;