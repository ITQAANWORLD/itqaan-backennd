const pool = require('../models/dbconfig');
const logger = require('../common/logger');

const fetchUser = async (arrKeys = [],table,whereClause,arrArgs = []) => {
  

    const connection = await pool.getConnection();

    try {
    
        let columns = '*';
        if (arrKeys.length > 0) {
            columns = arrKeys.join(',');
        }
        
        const query = await connection.query(`SELECT ${columns} FROM ${table}  ${whereClause}`, arrArgs );
        // if(error) {
            // console.log(query[0].length > 0) 
        //     return {"status" : false, "message" : err.message}
        // };
          
        if(query[0].length > 0) {
            return {
                "status" : true,
                "message" : "Found " + query[0].length,
                 "rows" : query[0]
               }
            
        } else {
            return {
                "status" : true,
                "message" : "No records"
               }
        }
        
        
    } catch( ex ) {
        console.error(ex)
        logger(`Error ${ex.message} ${ex.stack} \n` );

    } finally {
        connection.release();
    }

}

module.exports = fetchUser;