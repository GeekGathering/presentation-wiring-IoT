

// Prism syntax highlighting
// This is actually loaded from "bower_components" thanks to
// debowerify: https://github.com/eugeneware/debowerify


require('prism');
require('angular');
require('angular-sanitize');
require('bower-mqttws');
require('raphael');
require('justgage-toorshia')
require('angular-justgage')

var numberOfTeams = 4

var app = angular.module('WiringIoT', ['ngJustGage']);

app.controller('OnViewController', ['$scope','mqtt',OnViewController]);
function OnViewController($scope,mqtt){

  $scope.teams = [];

  for (i = 0; i < numberOfTeams; i++) {
    $scope.teams[i] = {
      teamId: i+1,
      on: false,
      lightBulbColor: 'bt-green'
    }
  }

  $scope.options = {
    title: '',
    valueFontColor: '#FFFFFF',
    levelColors: ['#2077b2'],
    hideMinMax: true,
    hideInnerShadow: true,
    gaugeColor: '#4b4b4b'
  };

  function bulbCicked(teamId) {
    console.log('bulbCicked',teamId);
    if($scope.teams[teamId-1].RgbLed == '#000000' ) {
      mqtt.publish('GG/Iot/' + teamId +'/RgbLed','#fbff00')
    } else {
      mqtt.publish('GG/Iot/' + teamId +'/RgbLed','#000000');
    }
  }

  $scope.bulbCicked = bulbCicked;

  function onMessage(topic,payload) {
    //console.log('message: ', topic , " " ,payload);
    topic_parts = topic.split('/')
    teamId = topic_parts[2] - 1;
    sensor = topic_parts[topic_parts.length-1];
    $scope.teams[teamId].on = true;
    $scope.teams[teamId][sensor] = payload;

    if (sensor == 'RgbLed') {
      if(payload == '#000000') {
        $scope.teams[teamId].lightBulbColor = 'bt-white'
      } else {
        $scope.teams[teamId].lightBulbColor = 'bt-yellow'
      }

    }


  }

  mqtt.onMessage(onMessage);


};

app.factory('mqtt',['$rootScope',mqtt]);
function mqtt($rootScope) {
  var client = new Paho.MQTT.Client('ws://connect.shiftr.io:1884/', 'bespoke-presentation-thing-service');
  var callbacks = [];

  client.onConnectionLost = function(res) {
    if(res.errorCode !== 0) {
      console.log('thing service connection has been lost');
    }
  };

  client.onMessageArrived = function(message) {
    //console.log('message: ', message.destinationName , " "  ,message.payloadString);
    $rootScope.$apply(function () {
      angular.forEach(callbacks, function(callback, key) {
        callback(message.destinationName,message.payloadString);
      });
    });
  };

  console.log('thing service connect ...');
  client.connect({
    userName: '16692b673ab28c3e',
    password: '47a0d99f90d110930638e5be3e57e0a5',
    onSuccess: function() {
      client.subscribe("GG/Iot/#");
      console.log('... thing service connected');
    }
  });

  function onMessage(callback) {
    callbacks.push(callback);
  }

  function publish(topic,payload) {
    message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    client.send(message);
  }

  return {
    onMessage: onMessage,
    publish: publish
  }

};

var remote = function() {
  return function(deck) {
    var client = new Paho.MQTT.Client('ws://connect.shiftr.io:1884/', 'bespoke-presentation-slide-controller');

    client.onConnectionLost = function(res) {
      if(res.errorCode !== 0) {
        console.log('slide controller connection has been lost');
      }
    };

    client.onMessageArrived = function(message) {
      var command = message.payloadString;
      console.log('slide controller command is ' + command);
      switch(command) {
        case 'next' : deck.next(); break;
        case 'prev' : deck.prev(); break;
        default: console.log('Unknown command: ' + command + '.');
      }
    };

    console.log('slide controller connect ...');
    client.connect({
      userName: 'bittailor',
      password: 'GeekGathering',
      onSuccess: function() {
        client.subscribe("GG/SlideController/WiringIoT/Command");
        console.log('... slide controller connected');
      }
    });
  }
};



// Require Node modules in the browser thanks to Browserify: http://browserify.org
var bespoke = require('bespoke'),
voltaire = require('bespoke-theme-voltaire'),
keys = require('bespoke-keys'),
touch = require('bespoke-touch'),
bullets = require('bespoke-bullets'),
backdrop = require('bespoke-backdrop'),
scale = require('bespoke-scale'),
hash = require('bespoke-hash'),
progress = require('bespoke-progress'),
forms = require('bespoke-forms');

// Bespoke.js
bespoke.from('article', [
voltaire(),
keys(),
touch(),
bullets('.bullet'),
backdrop(),
scale(),
hash(),
progress(),
forms(),
remote()
]);
