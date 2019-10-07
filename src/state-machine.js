const amqp = require('amqplib');
const StateMachine = require('javascript-state-machine');

let rabbit;
let rabbit_connection;

connect_to_queue();
async function connect_to_queue() {
  try {
    rabbit_connection = await amqp.connect({
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      heartbeat: 60,
    });
    let queue = 'state_machine';
    rabbit = await rabbit_connection.createChannel();

    rabbit.assertQueue(queue, {
      exclusive: false,
      durable: true
    });

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    rabbit.prefetch(1);


    rabbit.consume(queue, handle, {
      noAck: false
    })

  } catch (e){
    if (e) {
      console.log( e.message );
    }
    setTimeout(() => {
      connect_to_queue();
    },100);
  }
}

const fsm = new StateMachine({
  init: 'solid',
  transitions: [
    { name: 'melt',     from: 'solid',  to: 'liquid' },
    { name: 'freeze',   from: 'liquid', to: 'solid'  },
    { name: 'vaporize', from: 'liquid', to: 'gas'    },
    { name: 'condense', from: 'gas',    to: 'liquid' }
  ],
  methods: {
    onMelt: function(lifecycle, msg) {   
      let response = {
        'action': lifecycle.transition,
        'state': this.state
      }
      let response_string = JSON.stringify(response);
      rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
      rabbit.ack(msg);
    },
    onFreeze: function(lifecycle, msg) {
      let response = {
        'action': lifecycle.transition,
        'state': this.state
      }
      let response_string = JSON.stringify(response);
      rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
      rabbit.ack(msg);
    },
    onVaporize: function(lifecycle, msg) {
      let response = {
        'action': lifecycle.transition,
        'state': this.state   
      }
      let response_string = JSON.stringify(response);
      rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
      rabbit.ack(msg);
    },
    onCondense: function(lifecycle, msg) {
      let response = {
        'action': lifecycle.transition,
        'state': this.state
      }
      let response_string = JSON.stringify(response);
      rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
      rabbit.ack(msg);
    },
    failure: function(msg, transition_to) {   
      let response = {
        'action': 'no action',
        'message': 'can\'t do transition to: ' + transition_to,
        'state': this.state
      }
      let response_string = JSON.stringify(response);
      rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
      rabbit.ack(msg);
    },
    status: function(msg) {
      let response = {
        'state': this.state,
        'instructions': 'Please use query string to change state by specifying an action i.e. ?action=melt, ?action=vaporize, ?action=condense, ?action=freeze',
      }
      let response_string = JSON.stringify(response);
      rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
      rabbit.ack(msg);
    }
  }
});

async function handle(msg){
  let data = JSON.parse(msg.content.toString());
  console.log(" [x] Received %s", msg.content.toString());
  
  // Do something
  try {
    switch( data.params.action ) {
      case 'melt':
          if ( fsm.can('melt')) {
            await fsm.melt(msg);
          } else {
            await fsm.failure(msg, data.params.action);
          }
      break;
      case 'freeze':
          if ( fsm.can('freeze')) {
            await fsm.freeze(msg);
          } else {
            await fsm.failure(msg, data.params.action);
          }
      break;
      case 'condense':
          if ( fsm.can('condense')) {
            await fsm.condense(msg);
          } else {
            await fsm.failure(msg, data.params.action);
          }
      break;
      case 'vaporize':
          if ( fsm.can('vaporize')) {
            await fsm.vaporize(msg);
          } else {
            await fsm.failure(msg, data.params.action);
          }
      break;
      default:
        await fsm.status(msg);
      break;
    }
  } catch (e) {
    console.log(e.message);
  }
}