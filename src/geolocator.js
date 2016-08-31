function Geolocator (options) {

    if(!options) throw ('Specify callbacks');

    // Support
    this.status = -1;
    this.error  = '';

    // Config
    this.options = options || {};
    this.options.positionOptions = options.positionOptions || {};
    this.options.error = options.error || {};

    // Default values for positionOptions
    this.options.positionOptions = {
      enableHighAccuracy: options.positionOptions.enableHighAccuracy || true,
      maximumAge: options.positionOptions.maximumAge || 0
    };

    // Watcher
    this.watcher = {
      count: 0,
      first: {},
      last: {},
      id : null
    };

    // Moving
    this.moving = {
      status: false,  // -1: not started, 0: not moving, 1: moving, 2: running
      speed: 0,
      bearing: [],
      waypoints: [],
      check: 0, // 1: completed, 0: not running, 2: running
      getDistance: function() {
        var distance = 0;
        for(var x=1;x<this.waypoints.length;x++) {
          distance += parseFloat(calculateDistance(this.waypoints[x-1].position.coords.latitude, this.waypoints[x-1].position.coords.longitude, this.waypoints[x].position.coords.latitude, this.waypoints[x].position.coords.longitude));
        }
        return distance;
      },
      getAveSpeed: function() {
        var mspeed, cspeed,
            _c = 0,
            speed = parseFloat(0);

        for(var y=1;y<this.waypoints.length;y++) {
          if(typeof this.waypoints[y].speed !== "undefined" && this.waypoints[y].speed > 0) {
            speed += parseFloat(this.waypoints[y].speed);
            _c++;
          }
        }

        if(this.getCompleteTime() > 0) {
          cspeed = this.getDistance() / (this.getCompleteTime()/1000/60/60); // calculate the speed for whole distance
          mspeed =  parseFloat(calculateDistance(this.waypoints[0].position.coords.latitude, this.waypoints[0].position.coords.longitude, this.waypoints[this.waypoints.length-1].position.coords.latitude, this.waypoints[this.waypoints.length-1].position.coords.longitude)) / (this.getCompleteTime()/1000/60/60);
        }

        if(_c > 0) {
          return ((speed / _c) + cspeed + mspeed) / 3; // return avarage of both values
        }
        return 0;
      },
      getCompleteTime: function() {
        return this.waypoints[this.waypoints.length-1].position.timestamp - this.waypoints[0].position.timestamp;
      }
    };
    this.init();
}

/**
  *  Initialize the geolocator
  **/
Geolocator.prototype.init = function () {
  var _this = this;

  if (navigator.geolocation) {
    // Supported!
    this.status = 1;

    // check moving
    if(this.options.callbacks.isMoving || this.options.callbacks.isStandStill || this.options.callbacks.stepWatching) {

      this.watcher.id = this.addWatcher(this.collectData.bind(this));
      this.status = 2;

    } else if(this.options.callbacks.position) {

      if(typeof _this.options.callbacks.start === "function") {
        _this.options.callbacks.start();
      }

      navigator.geolocation.getCurrentPosition(

        function(pos) {

          _this.watcher.first = pos;
          _this.watcher.last = pos;
          _this.moving.waypoints[_this.watcher.count] = {
            position: pos
          };

          if(typeof _this.options.callbacks.position === 'function') {
            _this.options.callbacks.position(pos);
          }

          if(typeof _this.options.callbacks.ready === 'function') {
            _this.options.callbacks.ready(pos);
          }

        },
        function (error) {
          _this.handleError(error);
        });
    }
  } else {
    // Not supported :(
    this.status = 0;
    if(typeof this.options.error.posUnavailable === "function") {
      this.options.error.posUnavailable(error);
    }
  }
};

/**
  *    Add a Watcher to track positions
  **/
Geolocator.prototype.addWatcher = function (cb, options) {
  var _this = this;

  if(typeof _this.options.callbacks.start === "function") {
    _this.options.callbacks.start();
  }
  if(typeof _this.options.callbacks.startWatching === "function") {
    _this.options.callbacks.startWatching();
  }

  return navigator.geolocation.watchPosition(
    function(pos){ // success
      cb(pos, _this);
    },

    function(error) {
      _this.handleError(error);
    }, // error
    _this.options.positionOptions);
};

/**
  * Handle error from geolocator API
  */
Geolocator.prototype.handleError = function (error) {

  this.error = error;

  switch (error.code) {
    case 1:   // 1 === error.PERMISSION_DENIED //console.log('User does not want to share Geolocation data.');
              if(typeof this.options.error.pmDenied === "function") {
                this.options.error.pmDenied(error);
              }
              break;
    case 2:   // 2 === error.POSITION_UNAVAILABLE //console.log('Position of the device could not be determined.');
              if(typeof this.options.error.posUnavailable === "function") {
                this.options.error.posUnavailable(error);
              }
              break;
    case 3:   // 3 === error.TIMEOUT //console.log('Position Retrieval TIMEOUT.');
              if(typeof this.options.error.posUnavailable === "function") {
                this.options.error.posUnavailable(error);
              }
              break;
    default:  // 0 means UNKNOWN_ERROR //console.log('Unknown Error');
              break;
  }

  if(typeof this.options.error.default === "function") {
    this.options.error.default(error);
  }

  if(typeof this.options.callbacks.ready === 'function') {
    this.options.callbacks.ready(pos);
  }

};

/**
  *   collects data from Geolocation API
  **/
Geolocator.prototype.collectData = function (pos) {

  var speed = 0;

  if(this.watcher.count > 0) {
    var distance = Number(calculateDistance(this.watcher.last.coords.latitude, this.watcher.last.coords.longitude, pos.coords.latitude, pos.coords.longitude)).toFixed(6);
    var time = Number((pos.timestamp - this.watcher.last.timestamp)/1000).toFixed(6);

    time = time / 60 / 60;

    if(time) {
      speed = distance / time;
      this.moving.speed = speed;
    }

    // Calculate bearing beatween last points
    var bearing = bearingTo(this.watcher.last.coords.latitude, this.watcher.last.coords.longitude, pos.coords.latitude, pos.coords.longitude);

    this.moving.waypoints[this.watcher.count] = {
      position: pos,
      distance: distance,
      time: time,
      speed: speed,
      bearing: bearing
    };

    if(typeof this.options.callbacks.stepWatching === "function") {
      this.options.callbacks.stepWatching(this.moving.waypoints);
    }

  } else {

    this.watcher.first = pos;
    this.watcher.last = pos;
    this.moving.waypoints[this.watcher.count] = {
      position: pos
    };

    if(typeof this.options.callbacks.position === 'function') {
      this.options.callbacks.position(pos);
    }

  }

  this.checkMoving();
  this.last = pos;
  this.watcher.count++;

};

/**
  *  Check if device is moving
  *  TODO: Needs to be optimized, check Safari
  **/
Geolocator.prototype.checkMoving = function(minSpeed) {

  if(this.moving.check === 0 ) {

    var _this = this,
        count = 0,
        now = Date.now(),
        _bearingMax = 0;

    this.moving.check = 2;

    // checking
    var t = setInterval(function() {

      _bearingMax = _this.getBearingMax();

      // Check 7 times (3.5s)
      if(count++ === 7) {
        if(_this.moving.getDistance() > 0 && _bearingMax > 0 && _bearingMax < 30) {
          if(typeof _this.options.callbacks.isMoving === 'function') {
            _this.options.callbacks.isMoving(_this.moving);
          }
          _this.moving.status = 1;
        }
        else {

          if(typeof _this.options.callbacks.isStandStill === 'function') {
            _this.options.callbacks.isStandStill(_this.moving);
          }
          _this.moving.status = 0;
        }

        _this.moving.check = 1;
        navigator.geolocation.clearWatch(_this.watcher.id);

        if(typeof _this.options.callbacks.stoppedWatching === "function") {
          _this.options.callbacks.stoppedWatching();
        }
        if(typeof _this.options.callbacks.ready === "function") {
          _this.options.callbacks.ready();
        }

        clearInterval(t);

      }
    },500);
  }
  return 2;
};

/**
  *  Determine highest deviation from bearing
  **/
Geolocator.prototype.getBearingMax = function () {
  var _bearingMax = 0;
  for(var x=1; x<this.moving.waypoints.length;x++) {
    if(this.moving.waypoints[x-1].bearing > 0) {
      var _bearingDelta = Math.abs(this.moving.waypoints[x-1].bearing - this.moving.waypoints[x].bearing);
      if(_bearingDelta > 0) {
        if(_bearingDelta > _bearingMax) _bearingMax = _bearingDelta;
      }
    }
  }
  return _bearingMax;
};

/**
  *  Calculate distance between lat1,lon1 and lat2,lon2
  **/
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371, // km
      dLat = (lat2 - lat1).toRad(),
      dLon = (lon2 - lon1).toRad(),
      a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2),
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
  *  Returns the bearing from lat1,lon1 to lat2,lon2
  **/
function bearingTo(lat1, lon1, lat2, lon2) {
  var φ1 = lat1.toRad(), φ2 = lat2.toRad(),
      Δλ = (lon2-lon1).toRad(),
      y = Math.sin(Δλ) * Math.cos(φ2),
      x = Math.cos(φ1) * Math.sin(φ2) -
          Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ),
      θ = Math.atan2(y, x);
  return (θ.toDeg()+360) % 360;
}
Number.prototype.toRad = function() {
  return this * Math.PI / 180;
};
Number.prototype.toDeg = function () {
  return this * (180 / Math.PI);
};
