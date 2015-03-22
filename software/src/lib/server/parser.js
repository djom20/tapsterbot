var ArgumentParser = require('argparse').ArgumentParser;

// parse arguments
var parser =  new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Tapster Server'
});

parser.addArgument(
  [ '-c', '--calibration'], {
    help: 'file to load calibration data from'
  });

parser.addArgument(
  ['-p', '--port'] , {
    defaultValue: 4242
    , required: false
    , type: 'int'
    , example: "4242"
    , help: 'port to listen on'
  });

parser.addArgument(
  ['-a', '--address'], {
    defaultValue: '127.0.0.1'
    , required: false
    , example: "127.0.0.1"
    , help: 'IP Address to listen on'
  });

module.exports = parser;