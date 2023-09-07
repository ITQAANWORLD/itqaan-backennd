const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');
const logger = require('../common/logger');
const mpesa_req = require('../common/mpesa_req');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

const SERVICE_ID = 1

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
        
        const query1 = await connection.query('SELECT * FROM services where id = ?', [SERVICE_ID]);

        const service = query1[0];

        //if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        const query2 = await connection.query(sql, sqlParams );

        const institutions = query2[0];
        service[0].institutions = institutions;

        console.log(institutions + '\n' + sql)

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

router.get('/institution/:id', async (req,res) => {
    const id = parseInt(req.params.id)

    let sql = 'SELECT * FROM institution_cash_waqf ';
    let sqlParams = [];

    if (id > 0) {
        sql = sql + ` where id = ? `;
        sqlParams.push(id);
    }

    const connection = await pool.getConnection();

    try {
        
        const query1 = await connection.query(sql, sqlParams);

        const data = query1[0];

        // Contacts
        const query2 = await connection.query('SELECT name,phone_number FROM institution_cash_waqf_contacts WHERE institution_id = ?', id);

        data[0].contacts = query2[0];

        // payment modes
        const query3 = await connection.query('SELECT * FROM institution_cash_waqf_paymodes WHERE institution_id = ?', id);

        data[0].payment_modes = query3[0];

        // contributed amount
        const query4 = await connection.query('SELECT count(*) record_count, IFNULL(sum(amount), 0) total_amount FROM payments WHERE service_id = ? and institution_id = ?', [SERVICE_ID,  id]);

        data[0].summary = query4[0]

        // contributions
        const query5 = await connection.query('SELECT * FROM payments WHERE service_id = ? and institution_id = ? ORDER BY id DESC LIMIT 20', [SERVICE_ID,  id]);

        data[0].contributions = query5[0]

        res.json({
            "status" : "Success",
            "message" : "Fetched successfully", 
            "data" : data
            });
        
    } catch( ex ) {
        console.error(ex)
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
        payment_modes : Joi.array().items({ payment_type : Joi.number(), primaryValue : Joi.string().trim().min(2).max(50) ,secondaryValue : Joi.string().empty("").min(2).max(50) }).required().min(1),
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
        institution_cash_waqf(service_id,name,purpose,description,location,currency,target_amount,picture,website,type) \
         values(?,?,?,?,?,?,?,?,?,?)', 
        [SERVICE_ID,validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
            validatedData.value.location,validatedData.value.currency,validatedData.value.target_amount,validatedData.value.picture,
            validatedData.value.website, validatedData.value.type]);


        if(query1[0].insertId < 1) { throw 'Institution Inserted id ' + query1[0].insertId;}

        // Contacts
        for ( const index in validatedData.value.contacts) {
            let contact = validatedData.value.contacts[index]
            const query2 = await connection.query('INSERT INTO institution_cash_waqf_contacts(institution_id,name,phone_number)  values(?,?,?)', 
        [query1[0].insertId,contact.name, contact.phone_number]);
        
            if(query2[0].insertId < 1) { throw 'Contacts Inserted id ' + query2[0].insertId;}

        }

        // Payment Modes
        for ( const index in validatedData.value.payment_modes) {
            let payment_mode = validatedData.value.payment_modes[index]
            const query2 = await connection.query('INSERT INTO institution_cash_waqf_paymodes(service_id,institution_id,payment_type_id,primaryValue,secondaryValue)  values(?,?,?,?,?)', 
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

router.put('/institution/:id', async (req,res) => {
    const updateId = parseInt(req.params.id);

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
        contacts : Joi.array().items({ id : Joi.any(),institution_id : Joi.any(),name : Joi.string(), phone_number : Joi.number().error(new Error("Phone number should be numeric")) }).required().min(1),
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
        const query1 = await connection.query('UPDATE institution_cash_waqf SET name = ?, purpose = ?, description = ?, location = ?, currency = ?, \
            target_amount = ?, picture = ?, website = ?, type = ? WHERE id = ?', 
            [validatedData.value.name,validatedData.value.purpose,validatedData.value.description,
                validatedData.value.location,validatedData.value.currency,validatedData.value.target_amount,validatedData.value.picture,
                validatedData.value.website,validatedData.value.type,updateId]);

                //changedRows
        if(query1[0].affectedRows < 1) { throw 'Institution Updated id ' + updateId;}

        // Contatcs
        const query = await connection.query('DELETE FROM institution_cash_waqf_contacts WHERE institution_id = ?', [updateId]); 
        if(query[0].affectedRows < 1) { throw 'Failed to delete contacts for institution ' + updateId;}

        for ( const index in validatedData.value.contacts) {
            let contact = validatedData.value.contacts[index];
            const query2 = await connection.query('INSERT INTO institution_cash_waqf_contacts(institution_id,name,phone_number)  values(?,?,?)', 
                [updateId,contact.name, contact.phone_number]);
        
            if(query2[0].insertId < 1) { throw 'Contacts Inserted id ' + query1[0].insertId;}

        }

        // Payment Modes
        const delQuery = await connection.query('DELETE FROM institution_payments_modes WHERE service_id = ? and institution_id = ?', [SERVICE_ID,updateId]); 
        // if(delQuery[0].affectedRows < 1) { throw 'Failed to delete pay modes for institution ' + updateId;}

        for ( const index in validatedData.value.payment_modes) {
            let payment_mode = validatedData.value.payment_modes[index]
            const query2 = await connection.query('INSERT INTO institution_cash_waqf_paymodes(service_id,institution_id,payment_type_id,primaryValue,secondaryValue)  values(?,?,?,?,?)', 
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

});

router.post('/institution/:id/payment', async (req,res) => {
    const INSTITUTION_ID = parseInt(req.params.id);

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
    //         [payment_type_id,SERVICE_ID, INSTITUTION_ID ,validatedData.value.amount,validatedData.value.phone_number]);

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
    //console.log(`Time  ${Date.now().toString()}  ${req.method} ${req.url} ${req.ip}` );
    logger(` ${req.method} ${req.url} ${req.ip} \n` );
    next();
}

module.exports = router;