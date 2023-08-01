const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');
const mpesa = require('./mpesa');

const router = express.Router();

// middleware
router.use(serviceMiddleware);


const SERVICE_ID = 3

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

        // const query2 = await connection.query(sql, sqlParams );

        // const institutions = query2[0];
        // service[0].institutions = institutions;

        // console.log(institutions + '\n' + sql)

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
    //              res.json({
    //                 "status" : "Success",
    //                 "message" : "log successful"  ,
    //                 "data" : rows,
    //                });
                
                
    //         } else {
    //              res.json({
    //                 "status" : "Error",
    //                 "message" : "Failed to fetch data ",
    //                });
    //         }
            
    //         connection.release();
    //         return res;
    //     })
    // })
});

router.post('/payment', async (req,res) => {
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

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const payment_type_id = 1
        const Msisdn = validatedData.value.phone_number
        
        if(Msisdn.startsWith("0") && Msisdn.length == 10){
            Msisdn = "254" + Msisdn.slice(1,Msisdn.length)
        } else if (Msisdn.startsWith("254") && Msisdn.length == 12) {
            console.log("254 format")
        }

        const query1 = await connection.query('INSERT INTO payments(payment_type_id,service_id,institution_id,amount,phone_number) values(?,?,?,?,?)', 
            [payment_type_id,SERVICE_ID,'0',validatedData.value.amount,validatedData.value.phone_number]);

                //changedRows
        if(query1[0].insertId < 1) { throw 'Institution inserted id ' + updateId;}


        await connection.commit();

        res.json({
            "status" : "Success",
            "message" : "Check STK ",
        });
        
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
    
});

function serviceMiddleware(req,res,next) {
    console.log(`Time  ${Date.now().toString()}  ${req.method} ${req.originalURL}` );
    next();
}

module.exports = router;