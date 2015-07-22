function Geolocator () {

    // support
    this.status = -1;
    this.error  = '';

    // watcher
    this.count = 0;
    this.first = {};
    this.last = {};

    // config
    this.positionOptions = {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    };


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

    navigator.geolocation.getCurrentPosition(
      function(pos) {

        _this.first = pos;
        _this.last = pos;

        document.getElementById("start-pos").innerHTML = "Start: " + Number(pos.coords.latitude).toFixed(5) + "," + Number(pos.coords.longitude).toFixed(5);

      },
      function(error) {

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
    }, this.positionOptions);

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
Geolocator.prototype.addWatcher = function (cb, options) {
  var _this = this;

  if(navigator.geolocation) {

    return navigator.geolocation.watchPosition(
      function(pos){ // success
        cb(pos, _this);
      },

      function(error) {}, // error
      this.positionOptions);
  }
};

/**
*   Calculate the speed from positions
*
**/
Geolocator.prototype.calcSpeed = function (pos, _this) {

  //var distance = 0;
  //var speed = 0;
  //var time = 0;

  _this.count++;

  document.getElementById("watching").innerHTML = "Watching " + _this.count  + ": " + Number(pos.coords.latitude).toFixed(4) + "," + Number(pos.coords.longitude).toFixed(4);
  document.getElementById("distance").innerHTML = "Distance: " + Number(calculateDistance(_this.first.coords.latitude, _this.first.coords.longitude, pos.coords.latitude, pos.coords.longitude)).toFixed(3) + "km";
  document.getElementById("time").innerHTML = "Time: " + Number((pos.timestamp - _this.first.timestamp)/1000).toFixed(3) + "s";

  var distance = Number(calculateDistance(_this.first.coords.latitude, _this.first.coords.longitude, pos.coords.latitude, pos.coords.longitude)).toFixed(6);
  var time = Number((pos.timestamp - _this.last.timestamp)/1000).toFixed(6);

  time = time / 60 / 24;

  if(time) {
    speed = distance / time;
    console.log("Distance: " + distance);
    console.log("Speed: " + speed + "km/h");
    document.getElementById("speed").innerHTML = "Speed: " + speed + " km/h";
  }

  // Get speed from API
  var _x = document.getElementById("speed").innerHTML;
  document.getElementById("speed").innerHTML = _x + " (" + pos.coords.speed + ")";

  // Calculate bearing beatween last points
  var _bearing = document.getElementById("bearing").innerHTML;
  document.getElementById("bearing").innerHTML = _bearing + ', ' + bearingTo(_this.last.coords.latitude, _this.last.coords.longitude, pos.coords.latitude, pos.coords.longitude);

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
Number.prototype.toDeg = function () {
  return this * (180 / Math.PI);
};
/**
 *  Returns the bearing from lat1,lon1 to lat2,lon2
 **/
function bearingTo(lat1, lon1, lat2, lon2) {
  var φ1 = lat1.toRad(), φ2 = lat2.toRad();
  var Δλ = (lon2-lon1).toRad();
  var y = Math.sin(Δλ) * Math.cos(φ2);
  var x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  var θ = Math.atan2(y, x);
  return (θ.toDeg()+360) % 360;
}
