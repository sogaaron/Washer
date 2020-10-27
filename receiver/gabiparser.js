'use strict';

const BeaconParser = function() {
	this._SENSOR_SERVICE_UUID = 'ffe1';
};

BeaconParser.prototype.bye = function () {
	console.log("bye");
};

BeaconParser.prototype.parse = function(peripheral) {

	let ad = peripheral.advertisement;
	let manu = ad.manufacturerData;
	let res = {
		id                : peripheral.id,
		address           : peripheral.address,
		localName         : ad.localName || null,
		txPowerLevel      : ad.txPowerLevel || null,
		rssi              : peripheral.rssi
	};

	let sensor_service = ad.serviceData.find((el) => {
		return el.uuid === this._SENSOR_SERVICE_UUID;
    	});
	let parsed = null;

	if(sensor_service && sensor_service.data) {
		let beacon_type = 'sensor';
		res['beaconType'] = beacon_type;


		if(beacon_type === 'sensor'){
			parsed = this.sensorparse(peripheral);
		}
		if(parsed) {
                res[beacon_type] = parsed;
                return res;
        	} else {
			return null;
		}
	}

};

BeaconParser.prototype.sensorparse = function(peripheral) {
	let ad = peripheral.advertisement;
	let manu = ad.manufacturerData;
	let sensor_service = ad.serviceData.find((el) => {
		return el.uuid === this._SENSOR_SERVICE_UUID;
	});

	if(!sensor_service){
		return null;
	}
	let data = sensor_service.data;

	if(!data){
		return null;
	}

	let acc_x = toDecimal(data.toString('hex').substr(6,4));
	let acc_y = toDecimal(data.toString('hex').substr(10,4));
	let acc_z = toDecimal(data.toString('hex').substr(14,4));

	let res = {
		acceleration : {
			x: acc_x,
			y: acc_y,
			z: acc_z
		}
	};

	return res;

};



function toDecimal(word) {
    var integer = parseInt(word.substr(0,2),16);
    var decimal = parseInt(word.substr(2,2),16) / 256;
  
    if(integer > 127) {
      return (integer - 256) + decimal;
    }
    return integer + decimal;
  }

module.exports = new BeaconParser();
