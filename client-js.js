// const Device = require('bluetooth.js');

var percentage = 30;
// removed value assignment from blue at variable declaration
var blue;

// $(window).load(function() {
//
// });
//battery_service
$('#connect').on('touchstart click', (event) => {
  var services = $('#serviceFilter').val();
  var name = $('#nameFilter').val();
  var prefix = $('#prefixFilter').val();
  var filterObj = {}
  // moved here to populate from filters rather than on page load
  filterObj['services'] = ['battery_service'];
  //filterObj['optional_services'] = ['battery_service','carlos_custom_service'];
  if (services) filterObj['services'] = services;
  if (name) filterObj['name'] = name;
  if (prefix) filterObj['namePrefix'] = prefix;

  blue = new Device(filterObj);
  blue.connect().then(device => {
    $('#load').hide();
    $('#connect').hide();
    $('#getvalue').show();
    $('#startNotify').show();
    $('#stopNotify').show();
    $('#disconnect').show();
    $('#status').text('Connected!');
  }).catch(err => {
    console.log(err);
  })
  console.log(blue);
    $('#load').show();
});

$('#disconnect').on('touchstart click', (event) => {
    if (blue.disconnect()) {
      $('#status').text('Disconnected!');
      $('#connect').show();
      $('#disconnect').hide();
      $('#getvalue').hide();
      $('#startNotify').hide();
      $('#stopNotify').hide();
    }
    else {
      $('#status').text('Disconnect failed!');
    }
});

$('#getvalue').on('touchstart click', (event) => {
  var characteristic = $('#characteristic').val();
  console.log(characteristic);
  blue.getValue(characteristic)
  .then(value => {
    $('#level').text(`${value}%`);
    //percentage = value;
    batteryFill(value);
  })
  .catch(error => {
    console.log(error);
  })
});

$('#startNotify').on('touchstart click', (event) => {
  var characteristic = $('#characteristic').val();
  blue.startNotifications(characteristic, e => {
    console.log('start notify callback');
    var newHR = parseHeartRate(e.target.value);
    $('#level').append(`<p>${newHR.heartRate}</p>`);
  })
  // .then(value => {
  //   console.log('in returned promise...')

    // value.addEventListener('characteristicvaluechanged', event =>{
    //   var newHR = parseHeartRate(event.target.value);
    //   console.log('newHR: ', newHR);
    //   $('#level').append(`<p>${newHR.heartRate}</p>`);
    // });
  // })
  .catch(error => {
    console.log(error);
  })
});

$('#stopNotify').on('touchstart click', (event) => {
  var characteristic = $('#characteristic').val();
  blue.stopNotifications(characteristic).then(() => {
    console.log('in client-js2, stopped notifications');
  });
});

//TODO: handling for disconnect
$('#cancel').on('click', event => {
  event.preventDefault();
  $('#load').hide();
  $('#connect').show();
  $('#disconnect').hide();
  if (blue.disconnect()) $('#status').text('Not connected');
});

// $('#disconnect');


function batteryFill(percentage) {
  $('#battery-fill').velocity({
    height: `${percentage}%`
  },{
    duration:1000,
    easing:'linear'
  });
  // $('#battery-fill').addClass('battery-transition');
}


// Francios parser... need to add to gattCharacteristicsMapping object
function parseHeartRate(value) {
  // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
  //console.log('value: ', value);
  //console.log(value);
  //console.log('valueStr: ', JSON.stringify(value))
  value = value.buffer ? value : new DataView(value);
  console.log('Value from DataView: ',value);
  let flags = value.getUint8(0);
  //console.log('flags: ', flags);
  let rate16Bits = flags & 0x1;
  //console.log('rate16Bits: ', rate16Bits);
  let result = {};
  let index = 1;
  if (rate16Bits) {
    result.heartRate = value.getUint16(index, /*littleEndian=*/true);
    index += 2;
  } else {
    result.heartRate = value.getUint8(index);
    index += 1;
  }
  let contactDetected = flags & 0x2;
  //console.log('contactDetected: ', contactDetected);
  let contactSensorPresent = flags & 0x4;
  //console.log('contactSensorPresent: ', contactSensorPresent);
  if (contactSensorPresent) {
    result.contactDetected = !!contactDetected;
  }
  let energyPresent = flags & 0x8;
  //console.log('energyPresent: ', energyPresent);
  if (energyPresent) {
    result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
    index += 2;
  }
  let rrIntervalPresent = flags & 0x10;
  //console.log('rrIntervalPresent: ', rrIntervalPresent);
  if (rrIntervalPresent) {
    let rrIntervals = [];
    for (; index + 1 < value.byteLength; index += 2) {
      rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
    }
    result.rrIntervals = rrIntervals;
  }
  console.log('parsed result: ',result);
  return result;
}
