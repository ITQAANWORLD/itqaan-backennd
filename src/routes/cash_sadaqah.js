const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const payment_type_id = 1
const service_id = 2

router.get('/', (req,res) => {
    pool.getConnection((err,connection) => {
        if(err) throw err;
        connection.query('SELECT * FROM services where id = ?', [service_id] , (error,rows) => {
            if(error) throw error;
            
            if(rows.length > 0) {
                
                let sqlInstitution = 'SELECT * FROM institution_cash_sadaqah order by category asc';   

                connection.query(sqlInstitution,  (error1,rows1) => {
                    if(error1) throw error1;

                    rows[0]["institutions"] = rows1

                    

                    //    connection.query('SELECT * FROM individual_cash_sadaqah',  (error2,rows2) => {
                    //     if(error2) throw error2;
    
                    //     rows[0]["individuals"] = rows2
    
                        return res.json({
                            "status" : "Success",
                            "message" : "log successful"  ,
                            "data" : rows,
                           });
                        
                    //  })
                    
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

router.get('/institution/:id', (req,res) => {
    const id = parseInt(req.params.id)

    let sql = 'SELECT * FROM institution_cash_sadaqah ';
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

router.post('/institution', (req,res) => {
    const schema = Joi.object().keys({
        category : Joi.string().trim().min(2).max(150),
        name : Joi.string().required().trim().min(2).max(150),
        purpose : Joi.string().required().trim().min(2).max(80),
        description : Joi.string().required().trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        picture : Joi.string().empty().default('default.jpg').trim().min(3).max(150),
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
        institution_cash_sadaqah(service_id,category,name,purpose,description,location,picture,contact_details) \
         values(?,?,?,?,?,?,?,?)', 
        [service_id,validatedData.value.category,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
            validatedData.value.location,validatedData.value.picture, validatedData.value.contact] , (error,result) => {
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
                    "message" : "Insert successful " 
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

router.put('/institution/:id', (req,res) => {
    const updateId = parseInt(req.params.id);

    const schema = Joi.object().keys({
        category : Joi.string().required().trim().min(2).max(150),
        name : Joi.string().required().trim().min(2).max(150),
        purpose : Joi.string().required().trim().min(2).max(80),
        description : Joi.string().required().trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        picture : Joi.string().empty().default('default.jpg').trim().min(3).max(150),
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

        connection.query('UPDATE institution_cash_sadaqah SET category = ?,name = ?, purpose = ?, description = ?, location = ?,  \
         picture = ?, contact_details = ? WHERE id = ?', 
        [validatedData.value.category,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
            validatedData.value.location,validatedData.value.picture,
            validatedData.value.contact, updateId] , (error,result) => {
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

router.post('/institution/:id/payment', (req,res) => {
    const institution_id = parseInt(req.params.id)

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
                    "message" : "Connection failed",
                   });
            };

            console.log("payment id "+ result.insertId)
            connection.release();

            const credentials = {
                clientKey: process.env.MPESA_CONSUMER_KEY,
                clientSecret: process.env.MPESA_CONSUMER_SECRET,
                initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
                //securityCredential: 'ZUpsMTZYUVA5U3lPUE5oVGh0Mm9OdkphS0NvZEFKZHU6Z0ZBYTZhSmRvRFN6bEtORg==',
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