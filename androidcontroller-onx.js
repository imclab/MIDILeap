var originalCallVolume = device.audio.ringerVolume;

device.telephony.on('incomingCall', function (signal) 
{
	device.notifications.createNotification("INCOMING! " + signal.phoneNumber).show();

	console.info(signal);

	device.scheduler.setTimer({
		name: "checkingForInCallInputs", 
		time: 0,
		interval: 5*1000,
		exact: false
	},
		function () {
			checkIfPhoneShouldBeSilent();
		}
	);
});

device.telephony.on('idle', function () {
	device.notifications.createNotification("No longer in a call, I'll stop asking.").show();

	device.scheduler.removeTimer("checkingForInCallInputs");

	returnToPhoneDefaults();
});

function checkIfPhoneShouldBeSilent() {
	device.notifications.createNotification('Asking if I should be silent...').show();

	device.ajax({
		url: 'http://androidcontroller.herokuapp.com/shouldibesilent',
		type: 'POST',
		dataType: 'json',
		data: '{"call":"incoming"}',
		headers: {'Content-Type':'application/json'}
	}, function onSuccess(body, textStatus, response) {
		var JSONResponse = JSON.parse(body);
		console.info('successfully received http response!');
		device.notifications.createNotification('Got a response from server').show();
		console.info(JSON.stringify(JSONResponse));
		device.notifications.createNotification('It said ' + JSONResponse.callSound).show();

		if (JSONResponse.callSound === false) {
			device.audio.ringerVolume = 0;
		}
	}, function onError(textStatus, response) {
		var error = {};
		error.message = textStatus;
		error.statusCode = response.status;
		console.error('error: ',error);
	});
}

function returnToPhoneDefaults() {
	device.audio.ringerVolume = originalCallVolume;

	device.ajax({
		url: 'http://androidcontroller.herokuapp.com/call',
		type: 'POST',
		dataType: 'json',
		data: '{"action":"reset"}',
		headers: {'Content-Type':'application/json'}
	}, function onSuccess(body, textStatus, response) {
		var JSONResponse = JSON.parse(body);
		console.info('Successfully got a response after asking to reset the call state');
		device.notifications.createNotification('Successfully got a response after asking to reset the call state').show();
		console.info(JSON.stringify(JSONResponse));
	}, function onError(textStatus, response) {
		var error = {};
		error.message = textStatus;
		error.statusCode = response.status;
		console.error('error: ',error);
	});
}