var fs = require("fs");

module.exports.loadDataFromFilePath = function(filePath) {
// Default Calibration
  module.exports.data = {
    restPoint : {
      x : 0,
      y : 0,
      z : -120
    },
    servo1 : {
      minimumAngle : 20,
      maximumAngle : 90
    },
    servo2 : {
      minimumAngle : 20,
      maximumAngle : 90
    },
    servo3 : {
      minimumAngle : 20,
      maximumAngle : 90
    }
  };

  // Load Calibration Data
  if (fs.existsSync(filePath)) {
    module.exports.data = eval(fs.readFileSync(filePath, "utf8"));
  }
};