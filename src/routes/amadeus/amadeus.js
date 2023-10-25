require('dotenv').config()
const express = require('express')
const Joi = require('joi')
const logger = require('../../common/logger');
const Amadeus = require("amadeus")

const router = express.Router();

const amadeus = new Amadeus({
    clientId : 'ChvaxFiAytN1BWsA7AY3ltaWBB4V4ILG',
    clientSecret : 'yXuoFPhLLaby1RKY'
})

router.get('/city-and-airport-search/:location', async (req,res) => {
    const location =  String(req.params.location)
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

    try {
        const amadeusResponse = await amadeus.referenceData.locations.get({
            keyword: location,
            subType: Amadeus.location.any,
        })
        
        res.json({
            "status" : "Success",
            "message" : "Success ",
            "data" : JSON.parse(amadeusResponse.body)
        });
    
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed to fetch institution ",
        });
    } 

});

router.get('/flight-search', async (req,res) => {
    const originCode =  String(req.query.originCode)
    const destinationCode =  String(req.query.destinationCode)
    const dateOfDeparture =  String(req.query.dateOfDeparture)
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

    try {
        const amadeusResponse = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: originCode,
            destinationLocationCode: destinationCode,
            departureDate: dateOfDeparture,
            adults: '1',
            max: '7'
        })
        
        res.json({
            "status" : "Success",
            "message" : "Success ",
            "data" : JSON.parse(amadeusResponse.body)
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

router.get('/flight-confirmation', async (req,res) => {
    try {
        // const schema = Joi.object().keys({
        //     flight : Joi.string().required().min(2).max(100),
        // });
        // const data = req.body;
        
        // const joiResult = schema.validate(data);
        // if(joiResult.error) {
        //     return res.status(400).json({
        //         "status" : "Error",
        //         "message" : "Invalid request : " + joiResult.error.details[0].message
        //        });
        // } 

        const amadeusResponse = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: originCode,
            destinationLocationCode: destinationCode,
            departureDate: dateOfDeparture,
            adults: '1',
            max: '7'
        })
        
        res.json({
            "status" : "Success",
            "message" : "Success ",
            "data" : JSON.parse(amadeusResponse.body)
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