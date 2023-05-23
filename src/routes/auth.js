const Joi = require('joi')

const authenticationRoutes = (app) => {
    app.post('/login', (req,res) => {
        const schema = Joi.object().keys({
            email : Joi.string().email().required().min(3).max(150),
            password : Joi.string().required().min(8).max(100),
        });
        const data = req.body;
        
        const result = schema.validate(data);
        if(result.error) {
            return res.status(400).json({
                "status" : "Error",
                "message" : "Invalid " + result.error.details[0].message
               });
        } else {
            return res.json({
                "status" : "Success",
                "message" : "login " + result.value.email
               });
        }
        
    });

    app.post('/register', (req,res) => {
        const schema = Joi.object().keys({
            name : Joi.string().required().min(2).max(150),
            email : Joi.string().email().required().min(3).max(150),
            password : Joi.string().required().min(8).max(100),
        });
        const data = req.body;
        
        const result = schema.validate(data);
        if(result.error) {
            return res.status(400).json({
                "status" : "Error",
                "message" : "Invalid " + result.error.details[0].message
               });
        } else {
            return res.json({
                "status" : "Success",
                "message" : "register " + result.value.email
               });
        }
    });

    app.post('/forgotPassword', (req,res) => {
        const schema = Joi.object().keys({
            email : Joi.string().email().required().min(3).max(150),
        });
        const data = req.body;
        
        const result = schema.validate(data);
        if(result.error) {
            return res.status(400).json({
                "status" : "Error",
                "message" : "Invalid " + result.error.details[0].message
               });
        } else {
            return res.json({
                "status" : "Success",
                "message" : "forgot password " + result.value.email
               });
        }
    });
}

module.exports = authenticationRoutes;