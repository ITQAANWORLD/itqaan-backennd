require('dotenv').config();
const express = require('express')
const Joi = require('joi')
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');

const router = express.Router();

const environment = process.env.MPESA_ENVIRONMENT;

// middleware
router.use(serviceMiddleware);

router.post('/', (req,res) => {
    const schema = Joi.object().keys({
        payment_type_id : Joi.string().required().min(1).max(3),
        service_id : Joi.string().required().min(1).max(3),
        institution_id : Joi.string().required().min(1),
        amount : Joi.string().required().min(2).max(150),
        phone_number : Joi.string().required().min(10).max(12),
    });
    const data = req.body;
    
    const validatedData = schema.validate(data);
    if(validatedData.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid " + validatedData.error.details[0].message
           });
    } 

    pool.getConnection((err,connection) => {
        if(err) throw err;
        connection.query('INSERT INTO payments(payment_type_id,service_id,institution_id,amount,phone_number) values(?,?,?,?,?)', 
        [validatedData.value.payment_type_id,validatedData.value.service_id,validatedData.value.institution_id,validatedData.value.amount,validatedData.value.phone_number] , (error,result) => {
            if(error) {
                console.error(error);
                return res.json({
                    "status" : "Error",
                    "message" : "Request failed",
                   });
            };

            console.log("payment id "+ result.insertId)
            connection.release();

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
                    Amount: validatedData.value.amount,
                    Msisdn: validatedData.value.phone_number,
                    CommandID: "CustomerBuyGoodsOnline" , //CustomerPayBillOnline
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

           
            
        })
    })
});

router.post('/:id', (req,res) => {
    const id = parseInt(req.params.id);
    if (id = 3)
    pool.getConnection((err,connection) => {
        if(err) throw err;
        connection.query('SELECT * FROM institution where id = ?', [id] , (error,rows) => {
            if(error) throw error;

            connection.release();
            if(rows.length > 0) {
                return res.json({
                    "status" : "Success",
                    "message" : "Data fetched"  ,
                    "data" : rows,
                   });
                
                
            } else {
                return res.json({
                    "status" : "Error",
                    "message" : "Failed to fetch data ",
                   });
            }
            
        })
    })
});

function serviceMiddleware(req,res,next) {
    console.log(`Payment Time  ${Date.now().toString()}  ${req.method} ${req.originalURL}` );
    next();
}

module.exports = router;