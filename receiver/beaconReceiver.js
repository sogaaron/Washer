var fs = require('fs');
var jwt = require('jsonwebtoken');
var mqtt = require('mqtt');

var projectId = 'pi-iot-project-37';
var cloudRegion = 'us-central1';
var registryId = 'Pi3-DHT11-Nodes';
var deviceId = 'Pi3-DHT11-Node';

var mqttHost = 'mqtt.googleapis.com';
var mqttPort = 8883;
var privateKeyFile = './certs/rsa_private.pem';
var algorithm = 'RS256';
var messageType = 'state'; // or event

var mqttClientId = 'projects/' + projectId + '/locations/' + cloudRegion + '/registries/' + registryId + '/devices/' + deviceId;
var mqttTopic = '/devices/' + deviceId + '/' + messageType;
var iatTime = null; 

var connectionArgs = {
  host: mqttHost,
  port: mqttPort,
  clientId: mqttClientId,
  username: 'unused',
  password: createJwt(projectId, privateKeyFile, algorithm),
  protocol: 'mqtts',
  secureProtocol: 'TLSv1_2_method'
};

console.log('connecting...');
var client = mqtt.connect(connectionArgs);

// Subscribe to the /devices/{device-id}/config topic to receive config updates.
client.subscribe('/devices/' + deviceId + '/config');

client.on('connect', function(success) {
  if (success) {
    console.log('Client connected...');
    sendData();
  } else {
    console.log('Client not connected...');
  }
});

client.on('close', function() {
  console.log('close');
});

client.on('error', function(err) {
  console.log('error', err);
});

client.on('message', function(topic, message, packet) {
  console.log(topic, 'message received: ', Buffer.from(message, 'base64').toString('ascii'));
});


function createJwt(projectId, privateKeyFile, algorithm) {
    var token = {
      'iat': parseInt(Date.now() / 1000),
      'exp': parseInt(Date.now() / 1000) + 20 * 60, 
      'aud': projectId
    };
    iatTime = parseInt(Date.now() / 1000); 
    var privateKey = fs.readFileSync(privateKeyFile);
    return jwt.sign(token, privateKey, {
      algorithm: algorithm
    });
  }

setInterval(() => {   

  const secsFromIssue = parseInt(Date.now() / 1000) - iatTime;
  if (secsFromIssue >= 20 * 60 ) {
    iatTime = parseInt(Date.now() / 1000);
    console.log(`\tRefreshing token after ${secsFromIssue} seconds.`);

    client.end();

    connectionArgs = {
      host: mqttHost,
      port: mqttPort,
      clientId: mqttClientId,
      username: 'unused',
      password: createJwt(projectId, privateKeyFile, algorithm),
      protocol: 'mqtts',
      secureProtocol: 'TLSv1_2_method'
    };
    client = mqtt.connect(connectionArgs);
  }
},1000);

  const BeaconScanner = require('./scanner.js');
  const scanner = new BeaconScanner();
  scanner.onadvertisement = (ad) => {

  };
  
  // Start scanning
  scanner.startScan().then(() => {
  console.log('Started to scan.')  ;
  }).catch((error) => {
  console.error(error);
  });

 var count = 0;  
 var start_time = 0;
 var lapse_time = 0 ;   ///////////////////

class Queue {
  constructor() {
    this._arr = [];
  }
  enqueue(item) {
    if(this.length() == 60)
        this.dequeue();
    this._arr.push(item);
        console.log('queue :');
        console.log(this._arr);
    return this.onoff();
  }
  dequeue() {
    return this._arr.shift();
  }
  length() {
    return this._arr.length;
  }
  filter() {
    return this._arr.filter(item => item != 0);
  }
  onoff(){
    const nonzero = this.filter();
    if(nonzero.length > 10 && lapse_time < 49){
        console.log('on');
	      if(count == 0){
            start_time = Date.now() - 30*1000;  // 실제 시작보다 30초 늦게 체크되므로
            count = 1;
        }
        return true;
    }
    else {  /////추가
        console.log('off'); 
        start_time = 0;
        count = 0;
        return false;
    }
  }

}

const queue = new Queue(); 

function fetchData() {

    var timezoneOffset = new Date().getTimezoneOffset() * 60000;
    var timezoneDate = new Date(Date.now() - timezoneOffset);

    let res = scanner.info();
    if(!res){
        setTimeout(fetchData,1000);
    }else{
	var z = res['sensor']['acceleration']['z'];
	var now_time = Date.now();
        lapse_time = parseInt((now_time-start_time)/(1000*60));   ////////////

        // if(lapse_time == 44*60*1000)          
        //   lapse_time = lapse_time + 30*1000;
        // left_time = parseInt((49.5*60*1000 - lapse_time)/(1000*60)); 
	
	console.log(start_time);
	if(start_time == 0)
	  lapse_time = "0";       ////////////
	if(lapse_time<10)
       	  lapse_time = "0"+lapse_time;	  ///////////////
	console.log({
            'id':res['id'],
            'x':res['sensor']['acceleration']['x'],
            'y':res['sensor']['acceleration']['y'],
            'z':res['sensor']['acceleration']['z'],
            'time': timezoneDate.toISOString().slice(0, 19).replace('T', ' ')
         });
	
       return {
	          'time': timezoneDate.toISOString().slice(0, 19).replace('T', ' '),
	          'left' : lapse_time.toString(),     //////////////////
            'id':res['id'],
            'x':res['sensor']['acceleration']['x'],
            'y':res['sensor']['acceleration']['y'],
            'z':res['sensor']['acceleration']['z'],
	          'onoff':queue.enqueue(z)

	 };
    }
}

function sendData() {
    var payload = fetchData();
    
    payload = JSON.stringify(payload);
    console.log(mqttTopic, ': Publishing message:', payload);
    if(payload != null)
      client.publish(mqttTopic, payload, { qos: 1 });
    
    console.log('Transmitting in 1.5 seconds');
    setTimeout(sendData, 2000);     
}
