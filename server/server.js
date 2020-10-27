var http = require('http'); 
//var hostname = 'localhost'; // localhost와 동일
var port = 3000;

const {PubSub} = require('@google-cloud/pubsub');

var projectId = 'pi-iot-project-37'; 
var stateSubscriber = 'dht11-data' 
var p;
var onoff;
var time;
var left;

const pubsub = new PubSub();

const subscription = pubsub.subscription('projects/' + projectId + '/subscriptions/' + stateSubscriber);

const messageHandler = message => {
    p = message.data;
    
    var str  = Buffer.from(p, 'base64').toString('ascii');
    console.log(str);
    time = str.slice(9,28);
    console.log(time);
    if(str.includes('true')){
      onoff = 'ON';
    }
    else if(str.includes('false'))
      onoff = 'OFF';
    console.log(onoff);
    left = str.slice(38,40);

    message.ack();
};


subscription.on(`message`, messageHandler);


const server = http.createServer(function(req, res){
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'})
    res.write('<font size="200" color="green">' + time + '<br></font>')
    res.write('<font size="200" color="black">세탁기 작동 </font>')
    if(onoff == 'ON'){
        res.write('<font size="200" color="blue">' + onoff + '<br></font>')
	    res.write('<font size="200" color="black">경과 시간은 </font><font size="200" color="red">'+ left + '</font><font size="200" color="black">분 입니다.<br></font>')
    }else 
        res.write('<font size="200" color="red">' + onoff + '<br></font>')

//	res.write('<font size="200" color="black">남은 시간은 </font><font size="200" color="red">'+ left + '</font><font size="200" color="black">분 입니다.<br></font>')

    res.end()
})

server.listen(port, function(error){
    if(error){
        console.log('Something went wrong', error)
    } else{
        console.log('Server is listening on port ' + port)
    }
})

