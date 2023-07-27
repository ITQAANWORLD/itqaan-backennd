const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const payment_type_id = 1
const service_id = 3

router.get('/', (req,res) => {
    pool.getConnection((err,connection) => {
        if(err) throw err;
        connection.query('SELECT * FROM services where id = ?', [service_id] , (error,rows) => {
            if(error) throw error;
            
            if(rows.length > 0) {
                
                let sqlInstitution = 'SELECT * FROM institution_cash_waqf';   

                connection.query(sqlInstitution,  (error1,rows1) => {
                    if(error1) throw error1;

                    rows[0]["institutions"] = rows1

                    return res.json({
                        "status" : "Success",
                        "message" : "log successful"  ,
                        "data" : rows,
                       });
                    
                 })
                
                
                
            } else {
                return res.json({
                    "status" : "Error",
                    "message" : "Failed to fetch data ",
                   });
            }
            
            connection.release();
        })
    })
});

router.post('/payment', (req,res) => {
    const schema = Joi.object().keys({
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
        [payment_type_id,service_id,validatedData.value.institution_id,validatedData.value.amount,validatedData.value.phone_number] , (error,result) => {
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
            const mpesa = new Mpesa(credentials,process.env.MPESA_ENVIRONMENT);
        
            mpesa.c2bSimulate({
                    ShortCode: process.env.MPESA_SHORTCODE,
                    Amount: validatedData.value.amount,
                    Msisdn: validatedData.value.phone_number,
                    CommandID: "CustomerBuyGoodsOnline" , //CustomerPayBillOnline
                   // BillRefNumber: "Bill Reference Number" ,
                })
                .then((response) => {
                                    
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

function serviceMiddleware(req,res,next) {
    console.log(`Time  ${Date.now().toString()}  ${req.method} ${req.originalURL}` );
    next();
}

module.exports = router;