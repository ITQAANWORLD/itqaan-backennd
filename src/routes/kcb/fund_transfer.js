require('dotenv').config()
const express = require('express')
const unirest = require("unirest")
const Joi = require('joi')
const logger = require('../../common/logger');
const kcb_util = require("./kcb_util")


const router = express.Router();

router.post('/request', async (req,res) => {
    try {
        const schema = Joi.object().keys({
            beneficiaryAccount : Joi.string().required().min(2).max(20),
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

        const access_token = await kcb_util.getKCBToken();
        if( !access_token) {
            return res.json({
                "status" : "Error",
                "message" : "Failed token " 
            });
        }
        
// return res.json({token : token});
        const fetchSignature = await kcb_util.generateRequestSignature("1137890013");
        // console.log(fetchSignature)
        if(!fetchSignature.status ){
            return res.json({
                "status" : "Error",
                "message" : "Failed signature " 
            });
        }

        const payload = {
             "requestSignature" : fetchSignature.requestSignature,
             "payload" : {
                "requestId" : fetchSignature.requestId,
                "action" : "DISBURSEMENT",
                "companyCode": "KE0010001",
                "transactionType": "IF",
                "primaryAccountNumber": "1279258233",
                "amount": joiResult.value.amount, //10
                "amountCurrency": "KES",
                "beneficiaryAccount": "1318940532",
                "beneficiaryBankCode": "01",
                "retrievalRefNumber": `${Date.now()}`,
                "beneficiaryName": "JOHN DOE",
                "narration": "ITQAAN TEST PAYMENT 1",
                "resultUrl": "https://example.com/kcbft/notification",
                "additionalParams": [
                        {
                        "paramKey": "extraDetails1",
                        "paramValue": "details"
                        }
                    ]
                }
             
            }
        
        console.log(payload);

        const base_url = "https://uat.buni.kcbgroup.com/ft/v2/1.0.0/api/corporate" //"https://uat.buni.kcbgroup.com/fundstransfer/1.0.0"
        // const access_token = "eyJ4NXQiOiJNR1F6TmprelptVTFaV1k0T0dFNU5UZGpPRFU1T1RSak9ETmtaalZpWWpoaE4yRmtaamRoTURBNVpUWXdNamM0T0dWa1l6RXdaVE13WW1WbFlqZ3hZZyIsImtpZCI6Ik1HUXpOamt6Wm1VMVpXWTRPR0U1TlRkak9EVTVPVFJqT0ROa1pqVmlZamhoTjJGa1pqZGhNREE1WlRZd01qYzRPR1ZrWXpFd1pUTXdZbVZsWWpneFlnX1JTMjU2IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtdW5hd2FyQGNhcmJvbi5zdXBlciIsImF1dCI6IkFQUExJQ0FUSU9OIiwiYXVkIjoiNVJ1XzF2cjV5Xzd6cmRHOUN4aTd6ek9aekhzYSIsIm5iZiI6MTY5NDY4NDA5MCwiYXpwIjoiNVJ1XzF2cjV5Xzd6cmRHOUN4aTd6ek9aekhzYSIsImlzcyI6Imh0dHBzOlwvXC9rY2Itd3NvMmlzLmFwcHMudGVzdC5hcm8ua2NiZ3JvdXAuY29tOjk0NDRcL29hdXRoMlwvdG9rZW4iLCJleHAiOjE2OTQ2ODc2OTAsImlhdCI6MTY5NDY4NDA5MCwianRpIjoiZTgyYzdkYzEtYTg1ZS00YTgxLWI1ZjUtMjk5ODk1MTc2N2QxIn0.j3IAi8bOumOWj10E-egEWV9mTY48m1MnD5yj8prC3DFXZcNzxPCH2Rv5jtTu2y6ffrkzv6cJ63_3UhikwlWu_1zLrEnsVoDL6lSCCDB6rRizTf9gmwyrjqlZ7kFUFp4yiLKSNmoouUpn_wh376PsPgRpCQdTOx31oaRs8yQv_XFJ0jjUfVhxY1vxToWK4bLkkjpotYnL8L-LYOn8vzey_OyMziD5Fmdp_T7z5fKrI7TgnoDpPOkoGIoW8FcxAioqnzkUhb1xeJEF0OH72sH6M1_ks75ksvxaIr4FcsMCrfGmFJZ2SEnST24pJAMMqkrB4_-DXK6XI8-jzSvZrdeSMhoLu5HBwj5vFZQZXYGE0HFBudUq_ROPXzrG7Xt5fu0c_xAdZfpkxHekpoBtMHz44djpIvs8cq5tg_-1iwPzISOKOzZLr6-vNGObw1qHVgxqgL1f3Gd8zuFjF_b0FhJYwa3cH_0At2DbpPOpEH9aPaR3-UKfB2w74A5VeUxfRAmqhzD4r0-8ys8mWnapRyP3e2NcraXTdJQmPwbR4CZ6p4pFVOPYTg8gEpBl-89vsQYP-FRQAtZ-HkIaizo84IhsDJmWSGUTO-vQo7IVf1VDz9ksAsvK4TQnn5SAL99_M_lUyI0KF9j9rzsXoEK7ybvY1vFUlTcuCr5TsZKjf9KqpWQ"
        const stk_request = await unirest
        .post(`${base_url}`)
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json',
         'Authorization' : 'Bearer ' + access_token,
        })
        .send(payload)

        console.log(stk_request.raw_body, typeof stk_request.raw_body)
        //  if(stk_request.raw_body.code === "1") {
        //     res.json({
        //         "status" : "Error",
        //         "message" : "B2C request failed ",
        //         "data" : JSON.parse(stk_request.raw_body)
        //     });
        // }

        if(stk_request.raw_body.statusCode === '0'){
            res.json({
                "status" : "Success",
                "message" : "Success ",
                "data" : stk_request.raw_body
            });
        } else {
            res.json({
                "status" : "Error",
                "message" : "Transaction Failed ",
                "data" : stk_request.raw_body
            });
        }
        
    
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Transaction Failed",
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
        console.log("KCB Fund Transfer callback", req.body)
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