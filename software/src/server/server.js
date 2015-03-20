#! /usr/local/bin/node
var application_root = __dirname
  , parser = require("./parser")
  , Hapi = require("hapi")
  , path = require("path")
  , five = require("johnny-five")
  , calibration = require("./calibration")
  , Robot = require("./robot").Robot

args = parser.parseArgs();
calibration.loadDataFromFilePath(args.calibration);

var board = new five.Board({ debug: false});
board.on("ready", function() {
  var servo1 = five.Servo({
    pin: 9,
    range: [0,90]
  });

  var servo2 = five.Servo({
    pin: 10,
    range: [0,90]
  });

  var servo3 = five.Servo({
    pin: 11,
    range: [0,90]
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
  var robot = new Robot(servo1,servo2,servo3,calibration.data);

  // Move to starting point
  robot.setPosition(calibration.data.restPoint.x, calibration.data.restPoint.y, calibration.data.restPoint.z);

  // create a server with a host and port
  var server = new Hapi.Server();
  server.connection({
    host: args.address,
    port: args.port
  });

  server.route({
    method: 'GET',
    path:'/status',
    handler: function (request, reply) {
      console.log("GET " + request.path + ": ");
      reply('\"OK\"');
    }
  });

  server.route({
    method: 'POST',
    path:'/reset',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      robot.reset();
      reply(robot.getAngles());
    }
  });

  server.route({
    method: 'POST',
    path:'/dance',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      robot.startDancing();
      reply('\"Dancing!\"');
    }
  });

  server.route({
    method: 'POST',
    path:'/stopDancing',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      robot.stopDancing();
      reply('\"No more dancing.\"');
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
      return reply("\"OK\"");
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
      return reply("\"OK\"");
    }
  });

  server.route({
    method: 'GET',
    path:'/angles',
    handler: function (request, reply) {
      console.log("GET " + request.path + ": ");
      return reply(robot.getAngles());
    }
  });

  server.route({
    method: 'GET',
    path:'/position',
    handler: function (request, reply) {
      console.log("POST " + request.path + ": ");
      return reply(robot.getPosition());
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
      return reply(robot.getAnglesForPosition(x,y,z));
    }
  });

  server.start();
  console.log("Robot listening on port " + args.port);

});
