const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');
const logger = require('../common/logger');
const mpesa_req = require('../common/mpesa_req');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const payment_type_id = 1
const SERVICE_ID = 2

router.get('/',async  (req,res) => {

    let searchQuery = req.query.search
    let limitQuery = parseInt(req.query.limit) 
    let offsetQuery = parseInt(req.query.offset) 

    
    let sql = 'SELECT * FROM institution_cash_sadaqah ';
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

        const query3 = await connection.query('SELECT * FROM individual_cash_sadaqah', [] );

        const individuals = query3[0];
        service[0].individuals = individuals;


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
                
    //             let sqlInstitution = 'SELECT * FROM institution_cash_sadaqah order by category asc';   

    //             connection.query(sqlInstitution,  (error1,rows1) => {
    //                 if(error1) throw error1;

    //                 rows[0]["institutions"] = rows1

                    

    //                 //    connection.query('SELECT * FROM individual_cash_sadaqah',  (error2,rows2) => {
    //                 //     if(error2) throw error2;
    
    //                 //     rows[0]["individuals"] = rows2
    
    //                     return res.json({
    //                         "status" : "Success",
    //                         "message" : "log successful"  ,
    //                         "data" : rows,
    //                        });
                        
    //                 //  })
                    
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

    let sql = 'SELECT * FROM institution_cash_sadaqah ';
    let sqlParams = [];

    if (id > 0) {
        sql = sql + ` where id = ? `;
        sqlParams.push(id);
    }

    const connection = await pool.getConnection();

    try {
        
        const query1 = await connection.query(sql, sqlParams);

        const data = query1[0];

        // const query2 = await connection.query('SELECT name,phone_number FROM institution_cash_sadaqah_contacts WHERE institution_id = ?', id);

        // data[0].contacts = query2[0];

        const query3 = await connection.query('SELECT * FROM institution_cash_sadaqah_paymodes WHERE institution_id = ?', id);

        data[0].payment_modes = query3[0];

        res.json({
            "status" : "Success",
            "message" : "Fetched successfully", 
            "data" : data
            });
        
    } catch( ex ) {
        //console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

        res.json({
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
        category : Joi.string().default("INSTITUTION").trim().min(2).max(150),
        name : Joi.string().required().trim().min(2).max(150),
        purpose : Joi.string().required().trim().min(2).max(80),
        description : Joi.string().required().trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        picture : Joi.string().empty().default('default.jpg').trim().min(3).max(150),
        contacts : Joi.array().items({ name : Joi.string(), phone_number : Joi.number().error(new Error("Phone number should be numeric")) }).required().min(1),
        payment_modes : Joi.array().items({ payment_type : Joi.number(), primaryValue : Joi.string().trim().min(2).max(50) ,secondaryValue : Joi.string().empty("").min(2).max(50) }).required().min(1),
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
        await connection.beginTransaction();
        const query1 = await connection.query('INSERT INTO \
        institution_cash_sadaqah(service_id,category,name,purpose,description,location,picture) \
         values(?,?,?,?,?,?,?)', 
        [SERVICE_ID,validatedData.value.category,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
            validatedData.value.location,validatedData.value.picture]);


        if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        // CONTACTS
        for ( const index in validatedData.value.contacts) {
            let contact = validatedData.value.contacts[index]
            const query2 = await connection.query('INSERT INTO institution_cash_sadaqah_contacts(institution_id,name,phone_number)  values(?,?,?)', 
        [query1[0].insertId,contact.name, contact.phone_number]);
        
            if(query2[0].insertId < 1) { throw 'Contacts Inserted id ' + query1[0].insertId;}

        }

        // Payment Modes
        for ( const index in validatedData.value.payment_modes) {
            let payment_mode = validatedData.value.payment_modes[index]
            // const query2 = await connection.query('INSERT INTO institution_cash_waqf_pmode(institution_id,payment_type,primaryValue,secondaryValue)  values(?,?,?,?)', 
            const query2 = await connection.query('INSERT INTO institution_cash_sadaqah_paymodes(service_id,institution_id,payment_type_id,primaryValue,secondaryValue)  values(?,?,?,?,?)', 
        [SERVICE_ID,query1[0].insertId,payment_mode.payment_type,payment_mode.primaryValue, payment_mode.secondaryValue]);
        
            if(query2[0].insertId < 1) { throw 'Invalid Payment Mode Inserted id ' + query2[0].insertId;}

        }

        await connection.commit();
        
    } catch( ex ) {
        await connection.rollback();     
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

    
});

router.put('/:id', async (req,res) => {
    const updateId = parseInt(req.params.id);

    const schema = Joi.object().keys({
        category : Joi.string().default("INSTITUTION").trim().min(2).max(150),
        name : Joi.string().required().trim().min(2).max(150),
        purpose : Joi.string().required().trim().min(2).max(80),
        description : Joi.string().required().trim().min(2).max(250),
        location : Joi.string().required().trim().min(3).max(25),
        picture : Joi.string().empty().default('default.jpg').trim().min(3).max(150),
        contacts : Joi.array().items({ name : Joi.string(), phone_number : Joi.number().error(new Error("Phone number should be numeric")) }).required().min(1),
        payment_modes : Joi.array().items({ payment_type : Joi.number(), primaryValue : Joi.string().trim().min(2).max(50) ,secondaryValue : Joi.string().empty("").min(2).max(50) }).required().min(1),
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
        await connection.beginTransaction();
        const query1 = await connection.query('UPDATE institution_cash_sadaqah SET category = ?,name = ?, purpose = ?, description = ?, location = ?,  \
             picture = ? WHERE id = ?', 
            [validatedData.value.category,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
                validatedData.value.location,validatedData.value.picture, updateId]);

                //changedRows
        if(query1[0].affectedRows < 1) { throw 'Institution Updated id ' + updateId;}

        // CONTACTS
        const query = await connection.query('DELETE FROM institution_cash_sadaqah_contacts WHERE institution_id = ?', [updateId]); 
        if(query[0].affectedRows < 1) { throw 'Failed to delete contacts for institution ' + updateId;}

        for ( const index in validatedData.value.contacts) {
            let contact = validatedData.value.contacts[index];
            const query2 = await connection.query('INSERT INTO institution_cash_sadaqah_contacts(institution_id,name,phone_number)  values(?,?,?)', 
                [updateId,contact.name, contact.phone_number]);
        
            if(query2[0].insertId < 1) { throw 'Contacts Inserted id ' + query1[0].insertId;}

        }

         // Payment Modes
         const delQuery = await connection.query('DELETE FROM institution_cash_sadaqah_paymodes WHERE service_id = ? and institution_id = ?', [SERVICE_ID,updateId]); 
         // if(delQuery[0].affectedRows < 1) { throw 'Failed to delete pay modes for institution ' + updateId;}
 
         for ( const index in validatedData.value.payment_modes) {
             let payment_mode = validatedData.value.payment_modes[index]
             // const query2 = await connection.query('INSERT INTO institution_cash_waqf_pmode(institution_id,payment_type,primaryValue,secondaryValue)  values(?,?,?,?)', 
             const query2 = await connection.query('INSERT INTO institution_cash_sadaqah_paymodes(service_id,institution_id,payment_type_id,primaryValue,secondaryValue)  values(?,?,?,?,?)', 
         [SERVICE_ID,updateId,payment_mode.payment_type,payment_mode.primaryValue, payment_mode.secondaryValue]);
         
             if(query2[0].insertId < 1) { throw 'Invalid Payment Mode Inserted id ' + query2[0].insertId;}
 
         }

        await connection.commit();
        
    } catch( ex ) {
        await connection.rollback();

        console.error(ex)

        return res.json({
            "status" : "Error",
            "message" : "Failed to update institution ",
        });
    } finally{
        connection.release();
    }

    return res.json({
                    "status" : "Success",
                    "message" : "Update successfully" 
                    });


    // pool.getConnection((err,connection) => {
    //     if(err) throw err;

    //     connection.query('UPDATE institution_cash_sadaqah SET category = ?,name = ?, purpose = ?, description = ?, location = ?,  \
    //      picture = ? WHERE id = ?', 
    //     [validatedData.value.category,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
    //         validatedData.value.location,validatedData.value.picture, updateId] , (error,result) => {
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
    const institution_id = parseInt(req.params.id)

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
        }else {
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