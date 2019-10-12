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
  init: 'normal',
  transitions: [
    { name: 'poison',         from: 'normal',   to: 'poisoned' },
    { name: 'polymorph',      from: 'normal',   to: 'animal' },
    { name: 'polymorph',      from: 'poisoned', to: 'animal' },
    { name: 'heal',           from: 'animal',   to: 'normal' },
    { name: 'heal',           from: 'poisoned', to: 'normal' }
  ],
  methods: {
    onPoison: function(lifecycle, msg) {
      this.respond(lifecycle.action, msg);
    },
    onPolymorph: function(lifecycle, msg) {
      this.respond(lifecycle.action, msg);
    },
    onHeal: function(lifecycle, msg) {
      this.respond(lifecycle.action, msg);
    },
    respond: function(action, msg) {
      let response = {
        'action': action,
        'state': this.state,
        'statuses': this.allStates(),
        'moves': this.transitions(),
        'allMoves': this.allTransitions()
      }
      if (rabbit) {
        let response_string = JSON.stringify(response);
        rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
        rabbit.ack(msg);
      }
    },
    failure: function(transition_to, msg) {   
      let response = {
        'action': 'no action',
        'error': transition_to + ' failed!!',
        'state': this.state,
        'statuses': this.allStates(),
        'moves': this.transitions(),
        'allMoves': this.allTransitions()
      }
      if (rabbit) {
        let response_string = JSON.stringify(response);
        rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
        rabbit.ack(msg);
      }
    },
    status: function(msg) {
      let response = {
        'state': this.state,
        'statuses': this.allStates(),
        'moves': this.transitions(),
        'allMoves': this.allTransitions()
      }
      if ( rabbit ) {
        let response_string = JSON.stringify(response);
        rabbit.sendToQueue(msg.properties.replyTo, Buffer.from(response_string) );
        rabbit.ack(msg);
      }
    }
  }
});

async function handle(msg){
  let data = JSON.parse(msg.content.toString());
  console.log(" [x] Received %s", JSON.stringify(data.params));

  try {
    if ( ! data.params.action ) {
      await fsm.status(msg);
    } else if (fsm.can(data.params.action)) {
      await fsm[data.params.action](msg);
    } else {
      await fsm.failure(data.params.action, msg);
    }
  } catch (e) {
    console.log(e.message);
  }
}