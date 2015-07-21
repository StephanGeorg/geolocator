function Geolocator () {

    // support
    this.status = -1;
    this.error  = '';

    // watcher
    this.count = 0;
    this.first = {};
    this.last = {};


    this.init();

}

/**
 *  Initialize the geolocator
 *
 **/
Geolocator.prototype.init = function () {

  if (navigator.geolocation) {

    // Supported!
    this.status = 1;
    var _this = this;
    var start_pos;

    navigator.geolocation.getCurrentPosition(function(pos) {

      _this.first = pos;
      _this.last = pos;

      document.getElementById("start-pos").innerHTML = "Start: " + Number(pos.coords.latitude).toFixed(5) + "," + Number(pos.coords.longitude).toFixed(5);

    }, function(error) {

      this.error = error;

      switch (error.code) {
        case 1:   // 1 === error.PERMISSION_DENIED
                  console.log('User does not want to share Geolocation data.');
                  break;
        case 2:   // 2 === error.POSITION_UNAVAILABLE
                  console.log('Position of the device could not be determined.');
                  break;
        case 3:   // 3 === error.TIMEOUT
                  console.log('Position Retrieval TIMEOUT.');
                  break;
        default:  // 0 means UNKNOWN_ERROR
                  console.log('Unknown Error');
                  break;
      }
    });

    // check speed
    var watchSpeedId = _this.addWatcher(_this.calcSpeed);
    this.status = 2;


  } else {
    // Not supported :(

    this.status = 0;

  }
};

/**
*    Add a Watcher to track positions
*
**/
Geolocator.prototype.addWatcher = function (cb) {
  var _this = this;
  if(navigator.geolocation) {
    return navigator.geolocation.watchPosition(function(pos){
      cb(pos, _this);
    });
  }
};

/**
*   Calculate the speed from positions
*
**/
Geolocator.prototype.calcSpeed = function (pos, _this) {

  var distance = 0;
  var speed = 0;
  var time = 0;

  _this.count++;

  document.getElementById("watching").innerHTML = "Watching " + _this.count  + ": " + Number(pos.coords.latitude).toFixed(4) + "," + Number(pos.coords.longitude).toFixed(4);
  document.getElementById("distance").innerHTML = "Distance: " + Number(calculateDistance(_this.first.coords.latitude, _this.first.coords.longitude, pos.coords.latitude, pos.coords.longitude)).toFixed(3) + "km";
  document.getElementById("time").innerHTML = "Time: " + Number((pos.timestamp - _this.first.timestamp)/1000).toFixed(3) + "s";

  distance = Number(calculateDistance(_this.first.coords.latitude, _this.first.coords.longitude, pos.coords.latitude, pos.coords.longitude)).toFixed(6);
  time = Number((pos.timestamp - _this.first.timestamp)/1000).toFixed(6);

  time = time / 60 / 24;

  if(time > 0) {
    speed = distance / t;
    console.log("Distance: " + distance);
    console.log("Speed: " + speed + "km/h");
    document.getElementById("speed").innerHTML = "Speed: " + speed + " km/h";
  }

  _this.last = pos;

};





// Usefull methods
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad();
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}
Number.prototype.toRad = function() {
  return this * Math.PI / 180;
};
