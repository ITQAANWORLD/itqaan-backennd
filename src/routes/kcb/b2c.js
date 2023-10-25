require('dotenv').config()
const express = require('express')
const unirest = require("unirest")
const Joi = require('joi')
const logger = require('../../common/logger');


const router = express.Router();

router.post('/request', async (req,res) => {
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
                "header": {
                  "messageID": "12345667",
                  "featureCode": "701",
                  "serviceCode": "7001",
                  "serviceSubCategory": "ACCOUNT",
                  "minorServiceVersion": "1.0",
                  "timestamp": Date.now().toString() , // "1095379199.75"
                  "routeCode": "202"
                },
                "requestPayload": {
                  "transactionInfo": {
                    "transactionID": "FT20114BG8",
                    "transactionType": "1"
                  },
                  "additionalDetails": {
                    "keyOwner": "1",
                    "initiatorIdentifierType": "11",
                    "initiatorIdentifier": "IMT_Initiator",
                    "initiatorSecurityCredentials": "xxxxYo6U=",
                    "initiatorShortCode": "10017",
                    "receiverIdentifierType": "1",
                    "receiverIdentifier": "254722520441",
                    "amount": joiResult.value.amount , //"50"
                    "currency": "kes"
                  },
                  "optionalDetails": {
                    "customerName": "Jennifer",
                    "customerMSISDN": joiResult.value.phoneNumber , // "792483394"
                    "transactionNarration": "school fees"
                  }
                }
              }
        

        const base_url = "https://uat.buni.kcbgroup.com/businesTransfers/b2c/1.0.0"
        const access_token = "eyJ4NXQiOiJNR1F6TmprelptVTFaV1k0T0dFNU5UZGpPRFU1T1RSak9ETmtaalZpWWpoaE4yRmtaamRoTURBNVpUWXdNamM0T0dWa1l6RXdaVE13WW1WbFlqZ3hZZyIsImtpZCI6Ik1HUXpOamt6Wm1VMVpXWTRPR0U1TlRkak9EVTVPVFJqT0ROa1pqVmlZamhoTjJGa1pqZGhNREE1WlRZd01qYzRPR1ZrWXpFd1pUTXdZbVZsWWpneFlnX1JTMjU2IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtdW5hd2FyQGNhcmJvbi5zdXBlciIsImF1dCI6IkFQUExJQ0FUSU9OIiwiYXVkIjoiNVJ1XzF2cjV5Xzd6cmRHOUN4aTd6ek9aekhzYSIsIm5iZiI6MTY5NDQyMDY0OSwiYXpwIjoiNVJ1XzF2cjV5Xzd6cmRHOUN4aTd6ek9aekhzYSIsImlzcyI6Imh0dHBzOlwvXC9rY2Itd3NvMmlzLmFwcHMudGVzdC5hcm8ua2NiZ3JvdXAuY29tOjk0NDRcL29hdXRoMlwvdG9rZW4iLCJleHAiOjE2OTQ0MjQyNDksImlhdCI6MTY5NDQyMDY0OSwianRpIjoiY2EzMmRjOGYtYTRhYS00NGZhLWJlY2UtZjZmYTcyMTQ3YjU5In0.ITUIExasdXsw5RTqAazafuml-QHx7SOUJgJB11KM8pcHNd0pJJWxA0Ep12I8bHK9tlVAoWAsvHyUOAKsZr32RrhCZhiNOUJsvsSTeo-voIcw9HcrurGfr1M56XrxZvDl5G6udtDTzDSisGFdXXinxP-0344DbIR2ZxgkoxNEYO1QCOmSQDlMc1iVLMw7EwHrXAWA2L1dd0YKjQ0fPqRARrDAp6HNZNWs73uoJTxpmBuW9Hsgiz98ZghCAjJzNvG_hIhUSApM-_GyCOdFVd0SotHONaYNGlZSHN3W3-UYhoGni7TZ2YDZ9s0-jC1nwBuCMsYW4fImLo7gI_ACtGdQ4GPUD7oLKuLAE2yHXRA1rVfsuONa9sc9cuDuT3vKwrHN60_4ykRAgdpUWhH1JU1OmRgNAi5mq5jlkOa1sZLTKnMeuCxtEubL2XZbSlN9ToxM1roFEotCTcLJAXrQDYNdIHC9TUdPYTDVv2txiFdHA_JqH5Imy-uoS444VPYnIZV_qdIQpDXg_YfCJKszP17_25FJ8CNaXyy8kGglM4yz-YBiD7QPqC3pA0q61tfFOzKGysDtukm8xAOuRBj98pV7jkO7m9nfa9BigXotEXionFqngJ7D4dyGMDZHT_FjN5x3SEgZQWOhK79U0haBPX7WLUDFn_TmxT4GqPwxlZHHvCg"
        const stk_request = await unirest
        .post(`${base_url}/org/wallet`)
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json',
         'Authorization' : 'Bearer ' + access_token,
        })
        .send(payload)

        console.log(stk_request.raw_body, typeof stk_request.raw_body)
         if(stk_request.raw_body.code === "1") {
            res.json({
                "status" : "Error",
                "message" : "B2C request failed ",
                "data" : JSON.parse(stk_request.raw_body)
            });
        }

        if(stk_request.raw_body.header.statusCode === '0'){
            res.json({
                "status" : "Success",
                "message" : "Success ",
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