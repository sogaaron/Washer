'use strict';
const mBeaconParser = require('./gabiparser.js');

const BeaconScanner = function (params) {
	this.noble = null;
	if (params && 'noble' in params) {
		if (typeof (params['noble']) === 'object') {
			this.noble = params['noble'];
		} else {
			throw new Error('The value of the "noble" property is invalid.');
		}
	} else {
		try {
			this.noble = require('@abandonware/noble');
		} catch (e) {
			this.noble = require('noble');
		}
	}
	this.onadvertisement = null;

	// Private properties
	this._initialized = false;
	this._is_scanning = false;
};

BeaconScanner.prototype.hello = function () {
	console.log("hello");
};

BeaconScanner.prototype.stopScan = function () {
	this.noble.removeAllListeners('discover');
	if (this._is_scanning === true) {
		this.noble.stopScanning();
		this._is_scanning = false;
	}
};

BeaconScanner.prototype.startScan = function () {
	let promise = new Promise((resolve, reject) => {
		this._init().then(() => {
			this._prepareScan();
		}).then(() => {
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

let data = null;
BeaconScanner.prototype.info = function () {
	
	return data;
};

BeaconScanner.prototype._prepareScan = function () {
	let promise = new Promise((resolve, reject) => {
		this.noble.startScanning([], true, (error) => {
			if (error) {
				reject(error);
			} else {
				this.noble.on('discover', (peripheral) => {
					if (this.onadvertisement && typeof (this.onadvertisement) === 'function') {
						let parsed = this.parse(peripheral);
						if (parsed) {
                            data = parsed;
							this.onadvertisement(parsed);
                        }
					}
				});
				this._is_scanning = true;
				resolve();
			}
		});
	});
	return promise;
};

BeaconScanner.prototype._init = function () {
	let promise = new Promise((resolve, reject) => {
		this._initialized = false;
		if (this.noble.state === 'poweredOn') {
			this._initialized = true;
			resolve();
		} else {
			this.noble.once('stateChange', (state) => {
				if (state === 'poweredOn') {
					this._initialized = true;
					resolve();
				} else {
					let err = new Error('Failed to initialize the Noble object: ' + state);
					reject(err);
				}
			});
		}
	});
	return promise;
};

BeaconScanner.prototype.parse = function (peripheral) {
	return mBeaconParser.parse(peripheral);
};

module.exports = BeaconScanner;