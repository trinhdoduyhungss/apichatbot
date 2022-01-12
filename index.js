import fs from 'fs'
import fetch from 'node-fetch'
let data_conv = fs.readFileSync('data_conv.json', 'utf8')
data_conv = JSON.parse(data_conv);

import express from 'express'
let app = express();
import bodyParser from 'body-parser'

app.use(function (req, res, next) { 
    //allow cross origin requests
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
	res.header("Access-Control-Max-Age", "3600");
	res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
	next();
});

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('<h1> Hello World! </h1>');
    console.log(req.headers['x-forwarded-for']);
})


app.post('/send_message', function (req, res) {
    let data_post = req.body;
    let message = data_post.text;
    let user_id = data_post.ip;
    console.log(req.ips);
    if (req.headers['x-forwarded-for']) {
        user_id = req.headers['x-forwarded-for'];
    }
    if(data_conv[user_id]){
        data_conv[user_id].push({
            'text': message,
            'rule': 'user'
        });
    }
    else{
        data_conv[user_id] = [{
            'text': message,
            'rule': 'user'
        }];
    }
    fetch('https://va-ftech.dev.ftech.ai/rocketchat/send_message/1',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "text": message,
            "meta":{
                "user_id": ""
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        data_conv[user_id].push({
            'text': data.text,
            'rule': 'bot'
        });
        fs.writeFileSync('data_conv.json', JSON.stringify(data_conv));
        data['rule'] = 'bot';
        res.send(data);
    })
    .catch(error => console.error(error))
})


app.post('/get_message', function (req, res) {
    let data_post = req.body;
    let user_id = data_post.ip;
    if(req.headers['x-forwarded-for']){
        user_id = req.headers['x-forwarded-for'];
    }
    if(data_conv[user_id]){
        res.send(JSON.stringify({"results":data_conv[user_id]}));
    }else{
        res.send(JSON.stringify({"results":[]}));
    }
})

app.listen(app.get('port'), function () {
    console.log("running: port")
});