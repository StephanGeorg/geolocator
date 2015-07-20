function Geolocator () {
    this.init();

    this.status = -1;
    this.error  = '';

    this.last = {};

}


Geolocator.prototype.init = function () {

  if (navigator.geolocation) {
    // Supported!

    this.status = 1;
    var _this = this;
    var start_pos;


    // the first method you need to know about is
    // navigator.geolocation.getCurrentPosition()
    // which is going to be called once, on page load!
    // It'll initiate an asynchronous request to detect
    // the user's position and call a success/error callback.

    // Note, if it's the first time an app is trying
    // to get the position of the user, then the browser
    // is going to seek for permission to whether allow/deny.

    navigator.geolocation.getCurrentPosition(function(pos) {
      // we'll also store the start position to track
      // the distance travelled
      start_pos = pos;
      _this.last = start_pos;

      console.log(pos); // Go ahead an inspect the dumped "Geoposition" object in your console.

      // ob.timestamp is the time at which the data was read.
      // ob.coords contains the location data.
      // ob.coords.latitude and ob.coords.longitude are
      // the geographic coordinates in decimal degree.

      // Let's show the position lat, long in the HTML
      //$$('.start_lat')[0].innerHTML = pos.coords.latitude;
      //$$('.start_long')[0].innerHTML = pos.coords.longitude;

      console.log("Start: " + pos.coords.latitude + "," + pos.coords.longitude);
      document.getElementById("start-pos").innerHTML = pos.coords.latitude + "," + pos.coords.longitude;

    }, function(error) {

      this.error = error;
      console.log(error);

      switch (error.code) {
        case 1:
          // 1 === error.PERMISSION_DENIED
          console.log('User does not want to share Geolocation data.');
          break;

        case 2:
          // 2 === error.POSITION_UNAVAILABLE
          console.log('Position of the device could not be determined.');
          break;

        case 3:
          // 3 === error.TIMEOUT
          console.log('Position Retrieval TIMEOUT.');
          break;

        default:
          // 0 means UNKNOWN_ERROR
          console.log('Unknown Error');
          break;		}

    });


    // Great! Now we're the Geolocation API Masters :D

    // Finally, we need to learn about error handling too!
    // getCurrentPosition or watchPosition, both accepts
    // a second argument which can be a callback fired
    // if any error occurred. Let's see how.


    // Time to learn about how we can watch/track position, now.

    // If the position data changes or more accurate data arrives
    // then we can setup a callback to fire with the
    // watchPosition() function
    // it accepts arguments similarly to getCurrentPosition()

    // THe function returns an ID number that uniquely identifies
    // the watcher!

    var watch_id = navigator.geolocation.watchPosition(function(pos) {
      // lat, long


      //$$('.cur_lat')[0].innerHTML = pos.coords.latitude;
      //$$('.cur_long')[0].innerHTML = pos.coords.longitude;

      console.log("Watching..." + pos.coords.latitude + "," + pos.coords.longitude);
      document.getElementById("watching").innerHTML = pos.coords.latitude + "," + pos.coords.longitude;

      console.log("Distance: " + calculateDistance(start_pos.coords.latitude, start_pos.coords.longitude, pos.coords.latitude, pos.coords.longitude));
      document.getElementById("distance").innerHTML =  calculateDistance(start_pos.coords.latitude, start_pos.coords.longitude, pos.coords.latitude, pos.coords.longitude);

      console.log("Time: " + (_this.last.timestamp - pos.timestamp));
      document.getElementById("time").innerHTML = (_this.last.timestamp - pos.timestamp);

      _this.last = pos;

      // So, how about calculating the distance travelled
      // by the user from the start position to some 'x' position ?

      // Quite easy, we're going to use a function to calculate
      // the distance based on the start/end lat/long borrowed from:
      // http://www.html5rocks.com/en/tutorials/geolocation/trip_meter/

      //$$('.distance')[0].innerHTML = calculateDistance(start_pos.coords.latitude, start_pos.coords.longitude, pos.coords.latitude, pos.coords.longitude);

      // Nice! If you got a handheld device, just move around
      // and you'll see the Distance change in the output box!
    });

    // you can use the watch_id to stop tracking the user's
    // position further by passing to clearWatch()
    // similar to settimeout/cleartimeout or setInterval/clearInterval
    // navigator.geolocation.clearWatch(watch_id);




  } else {
    // Not supported :(

    this.status = 0;

  }
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
