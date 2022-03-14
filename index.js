import fetch from 'node-fetch'
import puppeteer from 'puppeteer'

let checkURL = {}

import express from 'express'
let app = express();
import bodyParser from 'body-parser'

app.set('port', (process.env.PORT || 5000));

app.use(function (req, res, next) { 
    //allow cross origin requests
	res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
	res.header("Access-Control-Max-Age", "3600");
	res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Accept");
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

async function crawl(url) {
    const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
    });
    const page = await browser.newPage();
    await page.goto(url);
    // try get the first image url that doesn't contain 'data:image' in the page if not found then get the logo url
    let imageUrl = await page.evaluate(() => {
        const image = document.querySelector("img");
        if (image) {
            const src = image.getAttribute("src");
            if (src.indexOf("data:image") === -1) {
                return src;
            }
        }
        const logo = document.querySelector("img[alt='logo']");
        if (logo) {
            return logo.getAttribute("src");
        }
        return null;
    });
    if(imageUrl){
        if(imageUrl.search("https://") === -1) {
            // remove the '/' at the end of the url
            url = url.substring(0, url.length - 1);
            imageUrl = url.trim('/') + imageUrl;
        }
        let titlePage = await page.title();
        await browser.close();
        // return a array contain the image url and the title of the page
        return [imageUrl, titlePage];
    }else{
        await browser.close();
        return null;
    }
}

app.get('/data_web', function(req, res){
    let url = req.query.url;
    let main_url = url.split('/');
    main_url = main_url[0]+'//'+main_url[2];
    if(url in checkURL || main_url in checkURL || checkURL[url] || checkURL[main_url]){
        return res.send(checkURL[url]);
    }else{
        const result = crawl(url);
        result.then(function(data){
            checkURL[url] = data;
            res.send(data);
        }).catch(function(err){
            const result = crawl(main_url);
            result.then(function(data){
                checkURL[url] = data;
                checkURL[main_url] = data;
                res.send(data);
            })
        });
    }
})

app.get('/test', function(req, res){
    fetch('https://apichatbotcomet.herokuapp.com/data_web?url=https://ftech.ai/',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => response.json()).then(data => {
        res.send(JSON.stringify(data));
    })
})

app.listen(app.get('port'), function () {
    console.log("running: port")
});


