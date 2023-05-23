const express = require('express');
const authenticationRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 

authenticationRoutes(app);

app.get('/', (req, res) => {
     res.send("Welcome to itqaan backend ");
    });

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})