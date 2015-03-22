#! /usr/local/bin/node

var parser = require("./lib/server/parser")
  , Hapi = require("hapi")
  , path = require("path")
  , five = require("johnny-five")
  , calibration = require("./lib/server/calibration")
  , Robot = require("./lib/server/robot").Robot;

var args = parser.parseArgs();
var robot, servo1, servo2, servo3;

var board = new five.Board({ debug: false});
board.on("ready", function() {
  servo1 = five.Servo({
    pin: 9,
    range: [0,120]
  });

  servo2 = five.Servo({
    pin: 10,
    range: [0,120]
  });

  servo3 = five.Servo({
    pin: 11,
    range: [0,120]
  });

  servo1.on("error", function() {
    console.log(arguments);
  });
  servo2.on("error", function() {
    console.log(arguments);
  });
  servo3.on("error", function() {
    console.log(arguments);
  });

  // Initialize Objects
  var calibrationData = calibration.getDataFromFilePath(args.calibration);
  calibrationData = calibrationData == null ? calibration.defaultData : calibrationData;
  robot = new Robot(servo1,servo2,servo3,calibrationData);

  // Move to starting point
  robot.resetPosition();

  // create a server with a host and port
  var server = new Hapi.Server();
  server.connection({
    host: args.address,
    port: args.port
  });

  var getCommonReponseObject = function(err, data) {
    if (err) {
      return { status:err.code, data: err };
    } else {
      return { status: 0, data: data };
    }
  };

  server.route({
    method: 'GET',
    path:'/status',
    handler: function (request, reply) {
      console.log("GET " + request.path + ": ");
      reply(getCommonReponseObject(null, '"OK"'));
    }
  });

  server.route({
    method: 'POST',
    path:'/reset',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      robot.resetPosition();
      reply(getCommonReponseObject(null, robot.getAngles()));
    }
  });

  server.route({
    method: 'POST',
    path:'/dance',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      robot.startDancing();
      reply(getCommonReponseObject(null, '"Dancing!"'));
    }
  });

  server.route({
    method: 'POST',
    path:'/stopDancing',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      robot.stopDancing();
      reply(getCommonReponseObject(null, '"No more dancing."'));
    }
  });

  server.route({
    method: 'POST',
    path:'/setAngles',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      var theta1 = parseFloat(request.payload.theta1);
      var theta2 = parseFloat(request.payload.theta2);
      var theta3 = parseFloat(request.payload.theta3);
      robot.setAngles(theta1, theta2, theta3);
      return reply(getCommonReponseObject(null, robot.getAngles()));
    }
  });

  server.route({
    method: 'POST',
    path:'/setPosition',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      var x = parseFloat(request.payload.x);
      var y = parseFloat(request.payload.y);
      var z = parseFloat(request.payload.z);
      robot.setPosition(x, y, z);
      return reply(getCommonReponseObject(null, '"OK"'));
    }
  });

  server.route({
    method: 'GET',
    path:'/angles',
    handler: function (request, reply) {
      console.log("GET " + request.path + ": ");
      return reply(getCommonReponseObject(null, robot.getAngles()));
    }
  });

  server.route({
    method: 'GET',
    path:'/position',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      return reply(getCommonReponseObject(null, robot.getPosition()));
    }
  });

  server.route({
    method: 'GET',
    path:'/anglesForPosition/x/{x}/y/{y}/z/{z}',
    handler: function (request, reply) {
      console.log("GET " + request.path + ": ");
      var x = parseFloat(request.params.x);
      var y = parseFloat(request.params.y);
      var z = parseFloat(request.params.z);
      return reply(getCommonReponseObject(null,robot.getAnglesForPosition(x,y,z)));
    }
  });

  server.route({
    method: 'GET',
    path:'/calibrationData',
    handler: function (request, reply) {
      console.log("GET " + request.path + ": ");
      return reply(getCommonReponseObject(null, robot.getCalibrationData()));
    }
  });

  server.route({
    method: 'POST',
    path:'/setCalibrationData',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      var newData = JSON.parse(request.payload.newData);
      robot.setCalibrationData(newData);
      return reply(getCommonReponseObject(null, robot.getCalibrationData()));
    }
  });

  server.start();
  console.log("Robot listening on port " + args.port);

});
