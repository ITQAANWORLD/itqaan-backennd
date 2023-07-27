const express = require('express')
const pool = require('../models/dbconfig');

const router = express.Router();

// middleware
router.use(serviceMiddleware);

router.get('/', (req,res) => {
    pool.getConnection((err,connection) => {
        if(err) throw err;
        connection.query('SELECT * FROM services', [] , (error,rows) => {
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

router.get('/:id', (req,res) => {
    const id = parseInt( req.params.id);
    pool.getConnection((err,connection) => {
        if(err) throw err;
        connection.query('SELECT * FROM services where id = ?', [id] , (error,rows) => {
            if(error) throw error;

            let institutions = null ;
            
            if(rows.length > 0) {
                // fetch cash waqf institutions
                let sqlInstitution = null;
                if (id === 1) {
                    sqlInstitution = 'SELECT * FROM institution_cash_waqf'
                } else if(id === 2 ) {
                    sqlInstitution = 'SELECT * FROM institution_cash_sadaqah'
                }

                connection.query(sqlInstitution,  (error1,rows1) => {
                    if(error1) throw error1;

                    console.log("institutions \n" + rows1)
                    //institutions = rows1;

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

function serviceMiddleware(req,res,next) {
    console.log(`Service Time  ${Date.now()} for ${req.method}` );
    next();
}

module.exports = router;