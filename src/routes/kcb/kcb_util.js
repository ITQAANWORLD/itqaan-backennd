const unirest = require('unirest')
const crypto = require('crypto')

async function getKCBToken() {
    const base_url = "https://uat.buni.kcbgroup.com/token?grant_type=client_credentials"
    // const base_url = "https://wso2-api-gateway-direct-kcb-wso2-gateway.apps.test.aro.kcbgroup.com/token"
    
    const stk_request = await unirest
    .post(`${base_url}`)
    .headers({
     'Authorization' : 'Basic ' + Buffer.from(`5Ru_1vr5y_7zrdG9Cxi7zzOZzHsa:JhDP7U9oJmTqxHQM6YeV1AEYJ6Ya`).toString('base64') ,
    })
    .send()

    // console.log(stk_request.raw_body, typeof stk_request.raw_body)
    const response = JSON.parse(stk_request.raw_body)
    return response.access_token;

    // curl -i -X POST -H "Content-Type:application/json" -d "{\"firstName\": \"Frodo\",  \"lastName\" : \"Baggins\" }" http://localhost:8080/people
    // curl -i -X POST -H 'Authorization: Basic b3pDWFZFcHM4dHJfWWNSbmN2SFBvMWtGSkdvYTpMZjVWZHFKNm4zcWZ1MWlLbXVxSXZGWTZ0N1lh' https://uat.buni.kcbgroup.com/token?grant_type=client_credentials
}

function generateRequestSignature(beneficiaryAccount) {
    try{
        const salt = "0f9f4fff-2798-4676-8524-68bb6602715"
        const timestamp = getTimeStamp()
        const requestId = Buffer.from(`${timestamp}:${beneficiaryAccount}`).toString('base64').slice(0,35)
        const requestSignature = crypto.createHash('sha512').update(`${requestId}${beneficiaryAccount}`).digest("hex")
        return {
            status : true,
            requestId : requestId,
            requestSignature : requestSignature
        }
    } catch (err) {
        return {
            status : false,
            // error : err
        }
    }
}

function getTimeStamp() {
    let date = new Date();
    let year = date.getFullYear().toString()
    let month = String("0"+ (date.getMonth() + 1)).slice(-2)
    let day = String("0"+date.getDate().toString()).slice(-2)

    let hours = String("0"+date.getHours().toString()).slice(-2)
    let minutes = String("0"+date.getMinutes().toString()).slice(-2)
    let seconds = String("0"+date.getSeconds().toString()).slice(-2)

   // date.toISOString().slice(0,19).replace('T','').replaceAll(':','').replaceAll('-','')
    return String(year+month+day+hours+minutes+seconds);
}

module.exports.getTimeStamp = getTimeStamp;
module.exports.getKCBToken = getKCBToken;
module.exports.generateRequestSignature = generateRequestSignature;