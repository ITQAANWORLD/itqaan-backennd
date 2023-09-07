const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');
const logger = require('../common/logger');
const mpesa_req = require('../common/mpesa_req');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const SERVICE_ID = 13

router.get('/', async (req,res) => {
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

    const connection = await pool.getConnection();

    try {
        
        const query1 = await connection.query('SELECT * FROM services where id = ?', [SERVICE_ID]);

        const service = query1[0];

        //if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        const query2 = await connection.query(sql, sqlParams );

        const institutions = query2[0];
        service[0].institutions = institutions;

        return res.json({
            "status" : "Success",
            "message" : "Fetched successfully", 
            "data" : service
            });
        
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed to fetch institution ",
        });
    } finally {
        connection.release();
    }


    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query('SELECT * FROM services where id = ?', [SERVICE_ID] , (error,rows) => {
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

router.get('/:id', async (req,res) => {
    const id = parseInt(req.params.id)

    let sql = 'SELECT * FROM institution_dial_a_sanda ';
    let sqlParams = [];

    if (id > 0) {
        sql = sql + ` where id = ? `;
        sqlParams.push(id);
    }

    const connection = await pool.getConnection();

    try {
        
        const query1 = await connection.query('SELECT * FROM services where id = ?', [SERVICE_ID]);

        const service = query1[0];

        //if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        const query2 = await connection.query(sql, sqlParams );

        const institutions = query2[0];
        service[0].institutions = institutions;


        return res.json({
            "status" : "Success",
            "message" : "Fetched successfully", 
            "data" : service
            });
        
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed to fetch institution ",
        });
    } finally {
        connection.release();
    }

    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query(sql, sqlParams , (error,rows) => {
    //         if(error) throw error;

    //         connection.release();

    //         if(rows.length > 0) {
                
    //             return res.json({
    //                 "status" : "Success",
    //                 "message" : "log successful"  ,
    //                 "data" : rows,
    //             });
                 
    //         } else {
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Failed to fetch data ",
    //                });
    //         }
            
            
    //     })
    // })
});

router.post('/', async (req,res) => {
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

    const connection = await pool.getConnection();

    try {
        
        const query1 = await connection.query('INSERT INTO \
            institution_dial_a_sanda(service_id,name,deceased_name,location,contact_details) \
             values(?,?,?,?,?)', 
            [SERVICE_ID,validatedData.value.name,validatedData.value.deceased_name,
                validatedData.value.location,validatedData.value.contact]);

        const service = query1[0];

        if(query1[0].insertId < 1) { throw 'Invalid Sanda Inserted id ' + query1[0].insertId;}

       
        return res.json({
            "status" : "Success",
            "message" : "Inserted successfully", 
            });
        
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed during execution ",
        });
    } finally {
        connection.release();
    }

    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query('INSERT INTO \
    //     institution_dial_a_sanda(service_id,name,deceased_name,location,contact_details) \
    //      values(?,?,?,?,?)', 
    //     [SERVICE_ID,validatedData.value.name,validatedData.value.deceased_name,
    //         validatedData.value.location,validatedData.value.contact] , (error,result) => {
    //         if(error) {
    //             console.error(error);
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Connection failed",
    //                });
    //         };

            
    //         connection.release();

         
    //         if (result.insertId > 0) {
    //             return res.json({
    //                 "status" : "Success",
    //                 "message" : "insert successful " 
    //                 });
    //        } else {
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Failed to update",
    //             });
    //        }
            
               
    //     })
    // })
});

router.put('/:id', async (req,res) => {
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

    const connection = await pool.getConnection();
    
    try {
        
        const query1 = await connection.query('UPDATE institution_dial_a_sanda SET name = ?, deceased_name = ?, location = ? ,contact_details = ? WHERE id = ?', 
            [validatedData.value.name,validatedData.value.description,validatedData.value.location,validatedData.value.contact, updateId]);

        const service = query1[0];

        if(query1[0].affectedRows < 1) { throw 'Invalid Sanda affected id ' + query1[0].insertId;}

       
        res.json({
            "status" : "Success",
            "message" : "Update successfully", 
            });
        
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        return res.json({
            "status" : "Error",
            "message" : "Failed during execution ",
        });
    } finally {
        connection.release();
    }

    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query('UPDATE institution_dial_a_sanda SET name = ?, deceased_name = ?, location = ? ,contact_details = ? WHERE id = ?', 
    //     [validatedData.value.name,validatedData.value.description,validatedData.value.location,validatedData.value.contact, updateId] , (error,result) => {
    //         if(error) {
    //             console.error(error);
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Connection failed",
    //                });
    //         };

    //         connection.release();

    //        if (result.affectedRows > 0) {
    //             return res.json({
    //                 "status" : "Success",
    //                 "message" : "Update successful " 
    //                 });
    //        } else {
    //             return res.json({
    //                 "status" : "Error",
    //                 "message" : "Failed to update",
    //             });
    //        }
            
               
    //     })
    // })
});

router.post('/:id/payment', async (req,res) => {
    const institution_id = parseInt(req.params.id);

    const schema = Joi.object().keys({
        amount : Joi.number().positive().precision(2).required().min(1).max(999999),
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

    // const connection = await pool.getConnection();

    // try {
    //     await connection.beginTransaction();

    //     const payment_type_id = 1
    const Msisdn = validatedData.value.phone_number
        
        if(Msisdn.startsWith("0") && Msisdn.length == 10){
            Msisdn = "254" + Msisdn.slice(1,Msisdn.length)
        } else if (Msisdn.startsWith("254") && Msisdn.length == 12) {
            console.log("254 format")
        } else {
            return  res.status(400).json({
                "status" : "Error",
                "message" : "Phone Number " 
            });
        }

        mpesa_req(Msisdn, validatedData.value.amount)

    //     const query1 = await connection.query('INSERT INTO payments(payment_type_id,service_id,institution_id,amount,phone_number) values(?,?,?,?,?)', 
    //         [payment_type_id,SERVICE_ID,'0',validatedData.value.amount,validatedData.value.phone_number]);

    //             //changedRows
    //     if(query1[0].insertId < 1) { throw 'Institution inserted id ' + updateId;}


    //     await connection.commit();

        res.json({
            "status" : "Success",
            "message" : "Check STK ",
        });
        
    // } catch( ex ) {
    //     await connection.rollback();

    //     console.error(ex)

    //     return res.json({
    //         "status" : "Error",
    //         "message" : "Failed to update institution ",
    //     });
    // } finally{
    //     connection.release();
    // }

});

function serviceMiddleware(req,res,next) {
    logger(` ${req.method} ${req.url} ${req.ip} \n` );
    next();
}

module.exports = router;