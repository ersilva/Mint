var mmt = require('../src/efsm');
var redis = require("redis");

var settings = {
  eventbus: {
    type: 'redis',
    host: '127.0.0.1',
    port: 6379
  }
};

mmt.init(settings);

var publisher = redis.createClient(settings.eventbus.port, settings.eventbus.host);

var efsm = new mmt.EFSM(
{
  id: "test",
  hascontext: true,
  logdata: true,
  onCreation: function() {},
  onDeletion: function() {},
  events: ['req', 'rep', 'timeout.to'],
  states: [
    {
      id: 'init'
    },
    {
      id: 'req_received',
      onStepIn: function() {},
      onStepOut: function() {},
    },
    {
      id: 'rabbit'
    },
    {
      id: 'timeout'
    },
    {
      id: 'turtle'
    }
  ], //states MUST start with init!
  transitions: [
    {
      from: 'init',
      to: 'req_received',
      event: 'req',
      conditions: [],
      actions: [{fct: mmt.startTimer, opts: {timeout: 2000, name: 'to'}}]
    },
    {
      from: 'req_received',
      to: 'rabbit',
      event: 'rep',
      conditions: [],
      actions: [{fct: mmt.printLog}, {fct: mmt.wipeLog}]
    },
    {
      from: 'req_received',
      to: 'timeout',
      event: 'timeout.to',
      conditions: [],
      actions: []
    },
    {
      from: 'rabbit',
      to: 'req_received',
      event: 'req',
      conditions: [],
      actions: [{fct: mmt.startTimer, opts: {timeout: 2000, name: 'to'}}]
    },
    {
      from: 'timeout',
      to: 'turtle',
      event: 'rep',
      conditions: [],
      actions: [{fct: mmt.printLog}, {fct: mmt.wipeLog}]
    },
    {
      from: 'turtle',
      to: 'req_received',
      event: 'req',
      conditions: [],
      actions: [{fct: mmt.startTimer, opts: {timeout: 2000, name: 'to'}}]
    }
  ]
});

var time = 1000;
setInterval(function(){ publisher.publish('tick', JSON.stringify(MMT.tickJSON(time))); time += 1000}, 1000);

//Rabbit
setTimeout(function(){ publisher.publish('req', JSON.stringify(MMT.attributeJSON(time, 'req', 'GET', [], 'i1'))); }, 1000);
setTimeout(function(){ publisher.publish('rep', JSON.stringify(MMT.attributeJSON(time, 'rep', 'OK', [], 'i1'))); }, 4000);
setTimeout(function(){ publisher.publish('rep', JSON.stringify(MMT.attributeJSON(time, 'rep', 'ERROR', [], 'i1'))); }, 4000);
//Turtle
setTimeout(function(){ publisher.publish('req', JSON.stringify(MMT.attributeJSON(time, 'req', 'GET', [], 'i1'))); }, 7000);
setTimeout(function(){ publisher.publish('rep', JSON.stringify(MMT.attributeJSON(time, 'rep', 'ERROR', [], 'i1'))); }, 14000);
setTimeout(function(){ publisher.publish('rep', JSON.stringify(MMT.attributeJSON(time, 'rep', 'OK', [], 'i1'))); }, 14000);

