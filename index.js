const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const amqp = require('amqplib');
const axios = require('axios');

let rabbit;
let rabbit_connection;

connect_to_queue();
async function connect_to_queue() {
  try{
    rabbit_connection = await amqp.connect({
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      heartbeat: 60,
    });
    rabbit = await rabbit_connection.createChannel();
  } catch (e){
    setTimeout(() => {
      connect_to_queue();
    },100);
  }
}

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));
app.set( 'view engine', 'pug' );

app.get( '/api*', async ( req, res ) => {
  let reply_to = 'web_server.reply.' + generateUuid();

  rabbit.assertQueue(reply_to,  {
    exclusive: true,
    autoDelete: true
  });

  let consume = await rabbit.consume(reply_to, (msg) => {

    let content_string = msg.content.toString();
    let reply = JSON.parse(content_string);
    res.send(reply);
    
    console.log(" [x] Replied");

    rabbit.cancel(consume.consumerTag);
  });

  let service = 'state_machine';

  let queue = rabbit.assertQueue(service, {
    exclusive: false,
    durable: true
  });

  if (queue.consumerCount <= 0){
    res.send({
      error: true,
      message: 'Invalid Request'
    });
    return;
  }


  req.headers.accept = req.headers.accept.split(',');

  let data = {
    headers: req.headers,
    method: req.method,
    params: req.query,
    //req: req
  };

  let data_string = JSON.stringify(data);

  rabbit.sendToQueue(service, Buffer.from(data_string), {
    persistent: true,
    replyTo: reply_to
  }, (err) => {
    if (err){
      throw err;
    }
  });

  console.log(" [x] Sent ");
});
  
app.get('*', async (req, res) => {
  const response = await axios.get('http://localhost:8081/api/');
  const buttons = response.data.allMoves.filter(function(value){
    return value !== 'init';
  });
  res.render('index', {
    title: 'Dingo Stories',
    message: 'Dingo Stories Game',
    buttons: buttons
  });
});

app.listen(8081, (e) => {
  if(e) {
    throw new Error('Internal Server Error');
  }
});


function generateUuid() {
  return Math.random().toString() +
    Math.random().toString() +
    Math.random().toString();
}