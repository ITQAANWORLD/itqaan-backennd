const pool = require('../models/dbconfig');

const fetchUser = (arrKeys = [],table,whereClause,arrArgs = []) => {
    pool.getConnection((err,connection) => {
        if(err) {
            console.log(err)
            return {"status" : true, "message" : err.message}
        };

        let columns = '*';
        if (arrKeys.length > 0) {
            columns = arrKeys.join(',');
        }
        connection.query(`SELECT ${columns} FROM ${table}  ${whereClause}`, arrArgs , (error,rows) => {
            if(error) {
                console.log(error)
                return {"status" : false, "message" : err.message}
            };

            connection.release();
            
            if(rows.length > 0) {
                return {
                    "status" : true,
                    "rows" : rows
                   }
                
            } else {
                return {
                    "status" : true,
                    "message" : "No records"
                   }
            }
            
        })
    });
}

module.exports = fetchUser;