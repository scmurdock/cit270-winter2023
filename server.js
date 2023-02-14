const express = require('express');
const app = express();
const port = 443;
const bodyParser = require('body-parser');
const {v4:uuidv4} = require('uuid');//imported function to generate random token
const Redis = require('redis');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');

const redisClient = Redis.createClient();//this points to redis
app.use(bodyParser.json());//application middleware - looks for incoming data

app.use(express.static('public'));

app.use(cookieParser());

app.use(async function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies.stedicookie;
    if (cookie === undefined && !req.url.includes("login")) {
      // no: set a new cookie
      res.status(401);
      res.send("no cookie")
    } else {
      // yes, cookie was already present 
    if(cookie!=undefined){
        const loginUser = await redisClient.hGet('TokenMap',cookie);   
        req.user=loginUser;   
    }
    next();
    } 
});

app.post('/rapidsteptest', async (req,res)=>{
    const loginToken = req.cookies.stedicookie;
    console.log('LoginUser:',req.user);
    const steps = req.body;
    console.log('Steps',steps);
    await redisClient.zAdd('Steps',[{score:0,value:JSON.stringify(steps)}]);

    res.send('saved');
});

app.get('/validate', async (req,res)=>{
    const loginToken = req.cookies.stedicookie;
    console.log('loginToken',loginToken);
    const loginUser = await redisClient.hGet('TokenMap',loginToken);
    res.send(loginUser);
});

app.post('/login',async (req,res)=>{
    const loginUser = req.body.userName;//access userName field on the body
    const loginPassword= req.body.password;//access the password field on the body
    console.log('Login username:'+loginUser);
    const correctPassword = await redisClient.hGet('UserMap',loginUser);//gets correct password from redis
    if (correctPassword==loginPassword){
        const loginToken = uuidv4();
        await redisClient.hSet('TokenMap',loginToken,loginUser);
        res.cookie('stedicookie',loginToken);
        res.send(loginToken);
    } else {
        res.status(401);//unauthorized
        res.send('Incorrect password for: '+loginUser);
    }
    
});

// app.listen(port,()=>{
//     redisClient.connect();
//     console.log('Listening');
// });

https.createServer(
    {
        key:fs.readFileSync('./server.key'),
        cert:fs.readFileSync('./server.cert'),
        ca:fs.readFileSync('./chain.pem')
    },
    app
).listen(port, ()=>{
    redisClient.connect();
    console.log('Listening on port: '+port);
});