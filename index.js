import fs from 'fs'
import fetch from 'node-fetch'
let data_conv = fs.readFileSync('data_conv.json', 'utf8')
data_conv = JSON.parse(data_conv);

import express from 'express'
let app = express();
import bodyParser from 'body-parser'

app.set('port', (process.env.PORT || 5000));

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

app.get('/ip', function (req, res) {
    res.send(JSON.stringify({"ip":req.headers['x-forwarded-for']}));
})

app.post('/send_message', function (req, res) {
    let data_post = req.body;
    let message = data_post.text;
    let user_id = data_post.token;
    let api_test = data_post.api_test;
    // if (req.headers['x-forwarded-for']) {
    //     user_id = req.headers['x-forwarded-for']+'_'+user_id;
    // }
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
    fetch(api_test,{
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
        let last_mess = data_conv[user_id][data_conv[user_id].length-1];
        let last_time_stamp = new Date().getTime();
        if(last_mess.rule == 'bot'){
            last_time_stamp = last_mess.time_stamp;
        }
        data_conv[user_id].push({
            'text': data.text,
            'rule': 'bot',
            'time_stamp': new Date().getTime()
        });
        fs.writeFileSync('data_conv.json', JSON.stringify(data_conv));
        data['rule'] = 'bot';
        let last_online = new Date().getTime()-last_time_stamp;
        if(last_online > 60000){
            // convert to minutes or hours
            if(last_online > 3600000){
                data['time_stamp'] = Math.floor(last_online/3600000)+' hours ago';
            }else{
                data['time_stamp'] = Math.floor(last_online/60000)+' minutes ago';
            } 
        }else{
            data['time_stamp'] = 'Just now';
        }
        res.send(data);
    })
    .catch(error => console.error(error))
})


app.post('/get_message', function (req, res) {
    let data_post = req.body;
    let user_id = data_post.token;
    // if(req.headers['x-forwarded-for']){
    //     user_id = req.headers['x-forwarded-for']+'_'+user_id;
    // }
    if(data_conv[user_id]){
        let last_mess = data_conv[user_id][data_conv[user_id].length-1];
        let last_time_stamp = new Date().getTime();
        if(last_mess.rule == 'bot'){
            last_time_stamp = last_mess.time_stamp;
        }
        let last_online = new Date().getTime()-last_time_stamp;
        if(last_online > 60000){
            // convert to minutes or hours
            if(last_online > 3600000){
                last_online = Math.floor(last_online/3600000)+' hours ago';
            }else{
                last_online = Math.floor(last_online/60000)+' minutes ago';
            }
        }else{
            last_online = 'Just now';
        }
        res.send(JSON.stringify({"results":data_conv[user_id], "time_stamp":last_online}));
    }else{
        res.send(JSON.stringify({"results":[], "time_stamp":"offline"}));
    }
})

app.listen(app.get('port'), function () {
    console.log("running: port")
});


