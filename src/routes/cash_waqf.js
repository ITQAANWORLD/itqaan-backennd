const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const payment_type_id = 1
const service_id = 1

router.get('/', async (req,res) => {
    let searchQuery = req.query.search
    let limitQuery = parseInt(req.query.limit) 
    let offsetQuery = parseInt(req.query.offset) 

    
    let sql = 'SELECT * FROM institution_cash_waqf ';
    let sqlParams = [];
    if (typeof searchQuery == 'string') {
        sql = sql + ` where name LIKE ? `
        sqlParams.push(`%${searchQuery}%`)
    }

    if(!isNaN(offsetQuery) && !isNaN(limitQuery) ) {
        sql = sql + ` LIMIT ?,? `
        sqlParams.push(offsetQuery,limitQuery)
    }

    const connection = await pool.getConnection();

    try {
        
        const query1 = await connection.query('SELECT * FROM services where id = ?', [service_id]);

        const service = query1[0];

        //if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        const query2 = await connection.query(sql, sqlParams );

        const institutions = query2[0];
        service[0].institutions = institutions;

        return res.json({
            "status" : "Success",
            "message" : "Added successfully", 
            "data" : service
            });
        
    } catch( ex ) {
        console.error(ex)

        return res.json({
            "status" : "Error",
            "message" : "Failed to add institution ",
        });
    } finally {
        console.log("Finally reached")
        connection.release();
    }

    

    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query('SELECT * FROM services where id = ?', [service_id] , (error,rows) => {
    //         if(error) throw error;
            
    //         if(rows.length > 0) {
                

    //             connection.query(sql, sqlParams , (error1,rows1) => {
    //                 if(error1) throw error1;

    //                 rows[0]["institutions"] = rows1

    //                 return res.json({
    //                     "status" : "Success",
    //                     "message" : "log successful"  ,
    //                     "data" : rows,
    //                    });
                    
    //              })
                
                
                
    //         } else {
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Failed to fetch data ",
    //                });
    //         }
            
    //         connection.release();
    //     })
    // })
});

router.get('/institution/:id', async (req,res) => {
    const id = parseInt(req.params.id)

    let sql = 'SELECT * FROM institution_cash_waqf ';
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

router.post('/institution', async (req,res) => {
    const schema = Joi.object().keys({
        name : Joi.string().required().trim().min(2).max(150),
        purpose : Joi.string().required().trim().min(2).max(80),
        description : Joi.string().required().trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        currency : Joi.string().default('KES').required().min(3).max(3),
        target_amount : Joi.number().positive().precision(2).required().min(1000).max(9999999),
        picture : Joi.string().required().trim().min(3).max(150),
        website : Joi.string().empty("").default(" ").trim().max(150),
        type : Joi.string().empty("").default(" ").trim().max(150),
        contacts : Joi.array().items({ name : Joi.string(), phone_number : Joi.number().error(new Error("Phone number should be numeric")) }).required().min(1),
    });
    const data = req.body;
    
    const validatedData = schema.validate(data);
    //console.log(validatedData.value)
    if(validatedData.error) {
        return res.status(400).json({
            "status" : "Error",
            "message" : "Invalid " + validatedData.error.details[0].message
           });
    } 

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const query1 = await connection.query('INSERT INTO \
        institution_cash_waqf(service_id,name,purpose,description,location,currency,target_amount,picture,contact_details,website,type) \
         values(?,?,?,?,?,?,?,?,?,?,?)', 
        [service_id,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
            validatedData.value.location,validatedData.value.currency,validatedData.value.target_amount,validatedData.value.picture,
            validatedData.value.contacts,validatedData.value.website, validatedData.value.type]);


        if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        for ( const index in validatedData.value.contacts) {
            let contact = validatedData.value.contacts[index]
            const query2 = await connection.query('INSERT INTO institution_cash_waqf_contacts(institution_id,name,phone_number)  values(?,?,?)', 
        [query1[0].insertId,contact.name, contact.phone_number]);
        
            if(query2[0].insertId < 1) { throw 'Contacts Inserted id ' + query1[0].insertId;}

        }

        await connection.commit();
        
    } catch( ex ) {
        await connection.rollback();
        connection.release();

        console.error(ex)

        return res.json({
            "status" : "Error",
            "message" : "Failed to add institution ",
        });
    } finally{
        connection.release();
    }

    return res.json({
                    "status" : "Success",
                    "message" : "Added successfully" 
                    });

    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query('INSERT INTO \
    //     institution_cash_waqf(service_id,name,purpose,description,location,currency,target_amount,picture,contact_details,website,type) \
    //      values(?,?,?,?,?,?,?,?,?,?,?)', 
    //     [service_id,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
    //         validatedData.value.location,validatedData.value.currency,validatedData.value.target_amount,validatedData.value.picture,
    //         validatedData.value.contacts,validatedData.value.website, validatedData.value.type] , (error,result) => {
    //         if(error) {
    //             console.error(error);
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Connection failed",
    //                });
    //         };

         
    //         if (result.insertId < 1) {
    //           connection.release();  

    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Failed to add institution",
    //             });
    //        }

    //        connection.query('INSERT INTO (institution_cash_waqf_contacts(institution_id,name,phone_number)  values(?,?,?)', 
    //        [result.insertId,validatedData.value.contacts.name, validatedData.value.contacts.name] , (error1,result1) => {
    //            if(error1) {
    //                console.error(error1);
    //                return res.json({
    //                    "status" : "Error",
    //                    "message" : "Failed to add contacts",
    //                   });
    //            };
            
    //            connection.release();  

    //            return res.json({
    //             "status" : "Success",
    //             "message" : "Added successfully" 
    //             });
               
    //     })
    // })
});

router.put('/institution/:id', (req,res) => {
    const updateId = parseInt(req.params.id);

    const schema = Joi.object().keys({
        name : Joi.string().required().trim().min(2).max(150),
        purpose : Joi.string().required().trim().min(2).max(80),
        description : Joi.string().required().trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        currency : Joi.string().default('KES').required().min(3).max(3),
        target_amount : Joi.number().positive().precision(2).required().min(1000).max(9999999),
        picture : Joi.string().required().trim().min(3).max(150),
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

        connection.query('UPDATE institution_cash_waqf SET name = ?, purpose = ?, description = ?, location = ?, currency = ?, \
        target_amount = ?, picture = ?, contact_details = ? WHERE id = ?', 
        [validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
            validatedData.value.location,validatedData.value.currency,validatedData.value.target_amount,validatedData.value.picture,
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