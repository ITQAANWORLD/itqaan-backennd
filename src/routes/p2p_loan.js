const express = require('express')
const Joi = require('joi');
const Mpesa = require('mpesa-api').Mpesa
const pool = require('../models/dbconfig');

const router = express.Router();

// middleware
router.use(serviceMiddleware);


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