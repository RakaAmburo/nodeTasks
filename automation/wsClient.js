const WebSocket = require('ws');
const fs = require('fs');
const validator = require("./reqValidator")
const shell = require('node-powershell');
const ks = require('node-key-sender');
const SerialPort = require('serialport')
const { exec } = require('child_process');

var privateKey = fs.readFileSync(__dirname + '/certs/client-key.pem', 'utf8');
var certificate = fs.readFileSync(__dirname + '/certs/client-crt.pem', 'utf8');

var wss
const connect = function () {
  console.log('connecting')
  wss = new WebSocket('wss://192.168.1.132:8095', {
    protocolVersion: 8,
    origin: 'https://192.168.1.132:8095',
    rejectUnauthorized: false,
    key: privateKey,
    cert: certificate,
    headers: { "authorization": validator.generateToken(), "client-id": "BI_COMPUTER" }
  });

  wss.on('open', function () {
    console.log('socket open');
  });

  wss.on('close', async function () {
    console.log('socket close');
    await sleep(10000)
    connect()
    
  });

  wss.on('error', function (error) {
    console.log(error.message)
  });

  wss.on('message', function incoming(action) {

    switch (action) {
      case "showMyInf":
        showMyInf()
        break;
      case "unlock":
        unlock()
        break;
      default:
        text = "Action not recognized!";
    }

    console.log("doing: " + action);
  });

}

connect()

function unlock() {
  exec('node unlock.js Alvaro01Costarica', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    wss.send(stdout)
  });
}

function showMyInf() {
  let ps = new shell({
    executionPolicy: 'Bypass',
    noProfile: true
  });

  ps.addCommand('Get-Content C:\\Users\\paparini\\Documents\\myinfo.txt | Set-Clipboard')
  ps.invoke().then(output => {
    ks.sendCombination(['control', 'v']);
    wss.send("key sent!!!")
  }).catch(err => {
    console.log(err);
    ps.dispose();
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 