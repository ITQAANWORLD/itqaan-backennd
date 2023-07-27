const fs = require('node:fs')
const fsp = require('node:fs/promises')
const express = require('express')

const router = express.Router();

router.post('/', (req,res) => {
    let filename = 'log.txt';
    let content = JSON.stringify(req.body) + '\n'
    fs.appendFile(filename, content, err => {
        if(err) throw err;

        res.json({ status : "Success"})
    })

    
});

router.post('/async', async (req,res) => {
    let filename = 'log.txt';
    let content = JSON.stringify(req.body) + '\n'
    try {
        await fsp.appendFile(filename,content);
    } catch (err) {
        console.log(err)
    } finally {
        console.log('Processed')
    }

    
});

module.exports = router;