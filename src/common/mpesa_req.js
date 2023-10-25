require('dotenv').config();
const express = require('express')
const Joi = require('joi')
const Mpesa = require('mpesa-api').Mpesa
const unirest = require('unirest')
const crypto = require("crypto");
const fs = require("node:fs");
const buffer = require("node:buffer");
const constants_1 = require("constants");
const { time } = require('console');
const kcb_util = require("../routes/kcb/kcb_util")


const environment = process.env.MPESA_ENVIRONMENT;

function getTimeStamp() {
    let date = new Date();
    let year = date.getFullYear().toString()
    let month = String("0"+ (date.getMonth() + 1)).slice(-2)
    let day = String("0"+date.getDate().toString()).slice(-2)

    let hours = String("0"+date.getHours().toString()).slice(-2)
    let minutes = String("0"+date.getMinutes().toString()).slice(-2)
    let seconds = String("0"+date.getSeconds().toString()).slice(-2)

   // date.toISOString().slice(0,19).replace('T','').replaceAll(':','').replaceAll('-','')
    return String(year+month+day+hours+minutes+seconds);
}

async function getToken() {
    // let request = unirest("GET", "https://sandbox.safaricom.co.ke/oauth/v1/generate");
    
    // request.query({
    //  "grant_type": "client_credentials"
    // });
    
    // request.headers({
    //  "Authorization": "Basic ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg===="
    // });
    
    // request.end(res => {
    //      //if (res.error) throw new Error(res.error);
    //     if (res.error) console.log(res.error);
    //      console.log(res.body);
    //     return res.body;
    // });

    let key = buffer.Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')
console.log('key ' + key)

    // unirest
    // .get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
    // .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic '+key})
    // .send({ "grant_type": "client_credentials" })
    // .then((response) => {
    //     console.log(response.body)
    // })

    try{

        let s = await unirest
        .get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic '+key})
        .send({ "grant_type": "client_credentials" }) 

        console.log("Res " + s.raw_body.access_token)
        return s.raw_body.access_token;
        // return "AD6DkdRXPpYPKvD0REfclpwcFQtJ"

    } catch (error) {
        console.log(error)
    }
}

async function generateSecurityCredential(password, certificatePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let certificate;
        if (certificatePath != null) {
            const certificateBuffer = yield fs_1.promises.readFile(certificatePath);
            certificate = String(certificateBuffer);
        }
        else {
            const certificateBuffer = yield fs_1.promises.readFile(path_1.resolve(__dirname, this.environment === 'production'
                ? 'keys/production-cert.cer'
                : 'keys/sandbox-cert.cer'));
            certificate = String(certificateBuffer);
        }
        this.securityCredential = crypto_1.publicEncrypt({
            key: certificate,
            padding: constants_1.RSA_PKCS1_PADDING,
        }, buffer_1.Buffer.from(process.env.MPESA_INITIATOR_PASSWORD)).toString('base64');
    });

    
}

async function getPassKey ( ) {
    const certPath = "C:\\Users\\amunawar\\javascript\\itqaan-backennd\\mpesa_certificates\\SandboxCertificate.cer";
    const CERTIFICATE = fs.readFileSync(certPath);
    console.log("Cert \n"+CERTIFICATE)

    const securityCredential = crypto.publicEncrypt({
        key: CERTIFICATE,
        padding: constants_1.RSA_PKCS1_PADDING,
    }, buffer.Buffer.from(process.env.MPESA_INITIATOR_PASSWORD)).toString('base64');

    console.log(securityCredential)
    return securityCredential;
}

async  function registerURL() {
    try{

        let access_token = await getToken();
        let s = await unirest
        .get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Basic '+ access_token})
        // .send({ "grant_type": "client_credentials" })

        console.log("Res " + s.raw_body.access_token)
        return s.raw_body.access_token;
        // return "YEGp3FakxzKA0Rn1h4GYdCS6zu0t"

    } catch (error) {
        console.log(error)
    }
}

async function stk_request(phoneNumber,amount) {
    kcb_stk_request(phoneNumber,amount)
    // let access_token = await getToken();
    // console.log(access_token)
    
    // // if('access_token' in access_token) {
    // //     return;
    // // }
    // // let securityCredential = await getPassKey();
    // let timestamp = getTimeStamp();
    // let base64String = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64')

    // const STK_CALLBACK_URL = "https://139.84.233.34:3000/stkcallback";

    // const payload = {    
    //     "BusinessShortCode": process.env.MPESA_SHORTCODE,    
    //     "Password": base64String,    
    //     "Timestamp":  timestamp,    
    //     "TransactionType": "CustomerBuyGoodsOnline",    
    //     "Amount": amount,    
    //     "PartyA":   phoneNumber,    
    //     "PartyB":   process.env.MPESA_SHORTCODE,    
    //     "PhoneNumber": phoneNumber,    
    //     "CallBackURL": STK_CALLBACK_URL,    
    //     "AccountReference":"Test",    
    //     "TransactionDesc":"Test"
    //  }

    // //  console.log(payload)

    // unirest
    //     .post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
    //     .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization' : 'Bearer ' + access_token})
    //     .send(payload)
    //     .then((response) => {
    //         const body = response.body
    //         console.log(body.ResponseCode)
    //         // if ( Respo)
    //     })
    
}

async function _saf_req(phoneNumber, amount) {
    const credentials = {
                    clientKey: process.env.MPESA_CONSUMER_KEY,
                    clientSecret: process.env.MPESA_CONSUMER_SECRET,
                    initiatorPassword: process.env.MPESA_PASSKEY,
                   // securityCredential: process.env.MPESA_PASSKEY,
                    certificatePath: 'mpesa_certificates/SandboxCertificate.cer'
                }

    const mpesa = new Mpesa(credentials,process.env.MPESA_ENVIRONMENT);

    mpesa.c2bSimulate({
            ShortCode: "174379", //process.env.MPESA_SHORTCODE
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

async function kcb_stk_request(phoneNumber, amount) {
    
    const payload = {
        "phoneNumber": phoneNumber,//"254722520441"
        "amount": amount , // "10"
        "invoiceNumber": "INV-10122",
        "sharedShortCode": true,
        "orgShortCode": "174379",
        "orgPassKey": "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
        "callbackUrl": "https://http://139.84.233.34/:3000/kcb-stk/callback",
        "transactionDescription": "school fee payment"
    }

    const base_url = "https://uat.buni.kcbgroup.com/mm/api/request/1.0.0"
    const access_token = kcb_util.getKCBToken();
    const stk_request = await unirest
                            .post(`${base_url}/stkpush`)
                            .headers({'Accept': 'application/json', 'Content-Type': 'application/json',
                            'Authorization' : 'Bearer ' + access_token,
                            'routeCode' : "207",
                            "operation" : "STKPush",
                            "messageId" : "232323_KCBOrg_8875661561" 
                            })
                            .send(payload)
    
    console.log(stk_request.raw_body)
    if(stk_request.raw_body.header.statusCode === '0'){
        return true;
    } else {
        return false;
    }
}

module.exports = stk_request;