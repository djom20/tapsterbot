#! /usr/local/bin/node

var prompt = require("prompt")
  , fs = require("fs")
  , eol = require('os').EOL
  , ArgumentParser = require('argparse').ArgumentParser
  , robot = require('./lib/server/robot_http_client').client("127.0.0.1","4242");

var args = {},
  newCalibrationData = {};

function CalibrationManager(argv) {
  args = argv;
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();
}
exports.CalibrationManager = CalibrationManager;

var getCommandLineArgs = function() {
  var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp:true,
    description: 'Tapster Calibration Script'
  });

  parser.addArgument(
    [ '-o', '--output' ], {
      defaultValue: "calibration.json"
      , help: 'file to save calibration data to'
    }
  );

  return parser.parseArgs();
};

CalibrationManager.prototype.calibrate = function() {
  robot.calibrationData(function (calibrationData) {
    console.log("Receiving existing calibration data.");
    newCalibrationData = calibrationData;
    console.log(newCalibrationData);
    var schema = {
      description: 'Please remove the arms from the robot and press any key to continue...',
      type: 'string'
    };
    prompt.get(schema, function () {
      calibrateServos(function () {
        console.log("New Calibration Data Generated.");
        console.log(newCalibrationData);
        robot.setCalibrationData(newCalibrationData, function () {
          console.log("Robot is now calibrated!");
          fs.writeFile(args.output, JSON.stringify(newCalibrationData, null, 2), function(err) {
            if(err) {
              console.log('Calibration data could not be saved: ' + err);
            } else {
              console.log('Calibration data saved to "' + args.output +'"');
            }
          });
        });
      });
    });
  });
};


var calibrateServos = function(cb) {
  var calibrateServoMinAndMax = function(armIndex, cb) {
    return robot.reset(function () {
      return calibrateServo(armIndex, true, function () {
        return calibrateServo(armIndex, false, cb);
      });
    });
  };
  return calibrateServoMinAndMax(0, function() {
    return calibrateServoMinAndMax(1, function() {
      return calibrateServoMinAndMax(2, function() {
        return robot.reset(cb);
      });
    });
  });
};

var calibrateServo = function(armIndex, isMin, cb) {
  robot.angles(function (angles) {
    var description = 'Enter an adjustment for arm #' + (armIndex +1) + ', enter 0 when the arm is ' +
      (isMin ? 'parallel to the roof.' : 'perpendicular to the roof');
    var schema = {
      name: "delta",
      description: description,
      type: 'number'
    };

    return prompt.get(schema, function (err, result) {
      if (result.delta < 0.05 && result.delta > -0.05) {
        newCalibrationData["servo" + (armIndex+1)][(isMin ? "min" : "max" ) + "imumAngle"] = angles[armIndex];
        return cb();
      } else {
        console.log("Old Angles: " + angles);
        angles[armIndex] = angles[armIndex] + result.delta;
        console.log("New Angles: " + angles);
        robot.setAngles(angles[0], angles[1], angles[2], function() {
          return calibrateServo(armIndex, isMin, cb);
        });
      }
    });
  });
};

if(require.main === module) {
  new CalibrationManager(getCommandLineArgs()).calibrate();
}
