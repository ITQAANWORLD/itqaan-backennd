const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const payment_type_id = 1
const service_id = 13

router.get('/', (req,res) => {
    let searchQuery = req.query.search
    let limitQuery = parseInt(req.query.limit) 
    let offsetQuery = parseInt(req.query.offset) 

    
    let sql = 'SELECT * FROM institution_dial_a_sanda ';
    let sqlParams = [];
    if (typeof searchQuery == 'string') {
        sql = sql + ` where name LIKE ? `
        sqlParams.push(`%${searchQuery}%`)
    }

    if(!isNaN(offsetQuery) && !isNaN(limitQuery) ) {
        sql = sql + ` LIMIT ?,? `
        sqlParams.push(offsetQuery,limitQuery)
    }

    pool.getConnection((err,connection) => {
        if(err) throw err;

        connection.query('SELECT * FROM services where id = ?', [service_id] , (error,rows) => {
            if(error) throw error;
            
            if(rows.length > 0) {
                

                connection.query(sql, sqlParams , (error1,rows1) => {
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

router.get('/:id', (req,res) => {
    const id = parseInt(req.params.id)

    let sql = 'SELECT * FROM institution_dial_a_sanda ';
    let sqlParams = [];

    if (id > 0) {
        sql = sql + ` where id = ? `;
        sqlParams.push(id);
    }


    pool.getConnection((err,connection) => {
        if(err) throw err;

        connection.query(sql, sqlParams , (error,rows) => {
            if(error) throw error;

            connection.release();

            if(rows.length > 0) {
                
                return res.json({
                    "status" : "Success",
                    "message" : "log successful"  ,
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

router.post('/', (req,res) => {
    const schema = Joi.object().keys({
        name : Joi.string().required().trim().min(2).max(150),
        deceased_name : Joi.string().optional().default('').trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        contact : Joi.string().required().trim().min(3).max(150),
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

        connection.query('INSERT INTO \
        institution_dial_a_sanda(service_id,name,deceased_name,location,contact_details) \
         values(?,?,?,?,?)', 
        [service_id,validatedData.value.name,validatedData.value.deceased_name,
            validatedData.value.location,validatedData.value.contact] , (error,result) => {
            if(error) {
                console.error(error);
                return res.json({
                    "status" : "Error",
                    "message" : "Connection failed",
                   });
            };

            
            connection.release();

         
            if (result.insertId > 0) {
                return res.json({
                    "status" : "Success",
                    "message" : "insert successful " 
                    });
           } else {
                return res.json({
                    "status" : "Error",
                    "message" : "Failed to update",
                });
           }
            
               
        })
    })
});

router.put('/:id', (req,res) => {
    const updateId = parseInt(req.params.id);

    const schema = Joi.object().keys({
        name : Joi.string().required().trim().min(2).max(150),
        deceased_name : Joi.string().optional().default('').trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        contact : Joi.string().required().trim().min(3).max(150),
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

        connection.query('UPDATE institution_dial_a_sanda SET name = ?, deceased_name = ?, location = ? ,contact_details = ? WHERE id = ?', 
        [validatedData.value.name,validatedData.value.description,validatedData.value.location,validatedData.value.contact, updateId] , (error,result) => {
            if(error) {
                console.error(error);
                return res.json({
                    "status" : "Error",
                    "message" : "Connection failed",
                   });
            };

            connection.release();

           if (result.affectedRows > 0) {
                return res.json({
                    "status" : "Success",
                    "message" : "Update successful " 
                    });
           } else {
                return res.json({
                    "status" : "Error",
                    "message" : "Failed to update",
                });
           }
            
               
        })
    })
});

router.post('/:id/payment', (req,res) => {
    const institution_id = parseInt(req.params.id);

    const schema = Joi.object().keys({
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
        [payment_type_id,service_id,institution_id,validatedData.value.amount,validatedData.value.phone_number] , (error,result) => {
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