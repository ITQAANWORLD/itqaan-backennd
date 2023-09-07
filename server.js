const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const authenticationRoutes = require('./src/routes/auth');
const mpesaRoutes = require('./src/routes/mpesa');
const paymentRoutes = require('./src/routes/payments');
const serviceRoutes = require('./src/routes/services');
const dialASandaRoutes = require('./src/routes/dial_a_sanda');
const cashWaqfRoutes = require('./src/routes/cash_waqf');
const cashSadaqahIndividualRoutes = require('./src/routes/cash_sadaqah_individual');
const cashSadaqahInstitutionRoutes = require('./src/routes/cash_sadaqah_institution');
const cashZakaatRoutes = require('./src/routes/cash_zakaat');
const logger = require('./src/common/logger');

const PORT = process.env.PORT || 3000;

const key = fs.readFileSync('./mpesa_certificates/key.pem')
const cert = fs.readFileSync('./mpesa_certificates/cert.pem')

const app = express();

app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 
app.use(cors({
    origin : '*',
    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}))

//Routes
app.use('/services', cors, serviceRoutes);
app.use('/dial_a_sanda', cors, dialASandaRoutes);
app.use('/payments', cors, paymentRoutes);
app.use('/mpesa', cors,mpesaRoutes);
app.use('/cash_waqf', cors, cashWaqfRoutes);
app.use('/cash_sadaqah/individual', cors,cashSadaqahIndividualRoutes);
app.use('/cash_sadaqah/institution',cors, cashSadaqahInstitutionRoutes);
app.use('/cash_zakaat',cors, cashZakaatRoutes);
//app.use('/logger', loggerRoutes);
app.use('/auth', cors,authenticationRoutes);

app.get('/', (req, res) => {
     res.send("Welcome to itqaan backend ");
});

http.createServer(app).listen(8080);

const server = https.createServer({key : key, cert : cert }, app);

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})