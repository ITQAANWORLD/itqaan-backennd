require('dotenv').config()
const express = require('express')
const unirest = require("unirest")
const Joi = require('joi')
const logger = require('../../common/logger');


const router = express.Router();

router.post('/request', async (req,res) => {
    //https://sandbox.buni.kcbgroup.com/devportal/apis/6396efd5-de10-4b04-adec-128f54349614/test
    try {
        const schema = Joi.object().keys({
            phoneNumber : Joi.string().required().min(2).max(100),
            amount : Joi.number().required().min(5).max(999999),
        });
        const data = req.body;
        
        const joiResult = schema.validate(data);
        if(joiResult.error) {
            return res.status(400).json({
                "status" : "Error",
                "message" : "Invalid request : " + joiResult.error.details[0].message
            });
        }

        const payload = {
            "phoneNumber": joiResult.value.phoneNumber,//"254722520441"
            "amount": joiResult.value.amount , // "10"
            "invoiceNumber": "INV-10122",
            "sharedShortCode": true,
            "orgShortCode": "174379",
            "orgPassKey": "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
            "callbackUrl": "https://http://139.84.233.34/:3000/kcb-stk/callback",
            "transactionDescription": "school fee payment"
        }

        const base_url = "https://uat.buni.kcbgroup.com/mm/api/request/1.0.0"
        const access_token = "eyJ4NXQiOiJNR1F6TmprelptVTFaV1k0T0dFNU5UZGpPRFU1T1RSak9ETmtaalZpWWpoaE4yRmtaamRoTURBNVpUWXdNamM0T0dWa1l6RXdaVE13WW1WbFlqZ3hZZyIsImtpZCI6Ik1HUXpOamt6Wm1VMVpXWTRPR0U1TlRkak9EVTVPVFJqT0ROa1pqVmlZamhoTjJGa1pqZGhNREE1WlRZd01qYzRPR1ZrWXpFd1pUTXdZbVZsWWpneFlnX1JTMjU2IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtdW5hd2FyQGNhcmJvbi5zdXBlciIsImF1dCI6IkFQUExJQ0FUSU9OIiwiYXVkIjoiNVJ1XzF2cjV5Xzd6cmRHOUN4aTd6ek9aekhzYSIsIm5iZiI6MTY5NDQxNjUyMiwiYXpwIjoiNVJ1XzF2cjV5Xzd6cmRHOUN4aTd6ek9aekhzYSIsImlzcyI6Imh0dHBzOlwvXC9rY2Itd3NvMmlzLmFwcHMudGVzdC5hcm8ua2NiZ3JvdXAuY29tOjk0NDRcL29hdXRoMlwvdG9rZW4iLCJleHAiOjE2OTQ0MjAxMjIsImlhdCI6MTY5NDQxNjUyMiwianRpIjoiMzgxNzFhZmUtMDFkMi00NTFiLThhMDktYTliMWM1YzM3Y2EwIn0.hlOfJfFyPrPUefy15z8UGaxq78kbzW3WvTQP6-OROWMU0J1QpL-enL_gaUk5nBKMYqCj971JVi0Xu9-272X_4ZE9ggb5a3NWWBkp_x3wJBSXriKbrMEnCBV707o8p5ulmVtKgvvXtP-5xOMk_LV0i50gvY6YHQiRfdOoUI6xRUg3F257af5Jyvm6lIWws6mhpCKveDx5FVG1PyCMogh_vAc7w5aV0SbLoDp3SbSA2h2m15Dz4PQxo7dMlSrW5XiklPL4ITGmVla2CkFY6tritHJdJtvi-fhTW79fSUXoiiJgEtCnJe-CBb7dojZW0re0xMn8ynWGTgkx8s0vcL4ktihcOOZM2OOJuE7uPo6l4fva5ZVcYPHlqo4fEvAFr7t_LK83CZWs9M1HAXLASKXJ7UpnxaE2WnejzsFCJO-oYVFeg1pZHiO9MH_XnlhjOi3vw0A8WpFy1_ev5FkTQXzfyD1VHX5DuH_C1-Q0bKtKoL31uaawFCPoF-W6x8_vsTl07onc7ETybsfHF-Qi8u__wn8Soq8ww6jK8gh28VxX9SqwukCF68p5ayQbMAPqRzpHJjopCyQx3kVVFIQ7Frf3syd9esLh4qUaleGL_SeQU3TYNrFuOKpO1LqN5peiedE90hVyyAqiYVIj8se9jz1gLQ9yEJd8y-vqAqbkVTKt3zY"
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
            res.json({
                "status" : "Success",
                "message" : "Success ",
                "data" : JSON.parse(stk_request.raw_body)
            });
        } else {
            res.json({
                "status" : "Error",
                "message" : "STK request failed ",
                "data" : JSON.parse(stk_request.raw_body)
            });
        }
        
    
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed to fetch institution ",
        });
    } 

});

router.get('/callback', async (req,res) => {

    try {
        // const schema = Joi.object().keys({
        //     location : Joi.string().required().min(2).max(100),
        // });
        // const data = req.body;
        
        // const joiResult = schema.validate(data);
        // if(joiResult.error) {
        //     return res.status(400).json({
        //         "status" : "Error",
        //         "message" : "Invalid request : " + joiResult.error.details[0].message
        //        });
        // } 
        console.log("KCB STK callback", req.body)
        res.json({
            "status" : "Success",
            "message" : "Success ",
        });
    
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed  ",
        });
    } 

});


module.exports = router;