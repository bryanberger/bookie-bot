'use strict';

var         uuid = require('node-uuid'),
         Helpers = require('./helpers'),
BotkitController = require('./botkit_controller');

var Events = module.exports;

Events.race = {
  id: uuid.v4(),
  tax: 0.10, // 10% goes to the house :)
  winner_id: -1,
  totalPool: 0,
  active: false,
  runners: [
    {id: 0, name: 'Secretariat', color: '#7ED321', odds: 0, oddsFraction: 0, pool: 0},
    {id: 1, name: 'Man O\' War', color: '#4A90E2', odds: 0, oddsFraction: 0, pool: 0},
    {id: 2, name: 'Seabiscuit', color: '#D52B3F', odds: 0, oddsFraction: 0, pool: 0},
    {id: 3, name: 'Ruffian', color: '#9641E1', odds: 0, oddsFraction: 0, pool: 0}
  ]
};

//Bryan, Zack, Anna, Graham
Events.admin = ['U0E8J127R', 'U0HNWMZJ7', 'U06BVLK8F'];

//function checks to see if user is admin
Events.isAdmin = function(message) {
  return this.admin.indexOf(message.user) !== -1;
}

// @ http://www.wisegeek.com/how-do-they-determine-horse-racing-odds.htm
Events.placeBet = function(wager) {
  // get the runner the player is betting on
  var race = this.race;
  var runner = race.runners[wager.runner_id];

  // increment the runner pool
  runner.pool += wager.amount;

  // increment the total pool
  race.totalPool += runner.pool;

  // re-calculate the odds
  this.calculateOdds();
}

Events.calculateOdds = function() {
  var race = this.race;
  race.runners.forEach(function(runner) {

    if(runner.pool === 0) {
      runner.odds = runner.oddsFraction = 0;
      return;
    }

    var reducedFraction = Helpers.reduceFraction(Math.floor(runner.odds * race.runners.length), race.runners.length);
    runner.odds = (race.totalPool - (race.totalPool * race.tax)) / runner.pool;
    runner.oddsFraction = reducedFraction[0] + '/' + reducedFraction[1];
  });
}

Events.payOut = function() {
  var race = this.race;
  // TESTING
  race.winner_id = 0;

  console.log(race);

  // if the race is no longer active, there is a pool, and winners
  if(!race.active && race.totalPool > 0 && race.winner_id > -1) {

    console.log('active race with a pool');

    // loop over every player
    BotkitController.controller.storage.users.all(function(err, all_user_data) {
      all_user_data.forEach(function(user_data) {

        if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager') && user_data.wager.race_id === race.id) {
          // user placed a wager on this race
          var wager = user_data.wager;
          var payout = 0;

          if(wager.runner_id === race.winner_id) {
            payout = (race.runners[wager.runner_id].odds * wager.amount) + wager.amount;
          }

          // deduct the payout from the payout pool
          race.totalPool -= payout;

          console.log(user_data.username, payout);

          // add the payout back to this user's object

          // notify the user of their earnings if > 0
        }

      });
    });
  }
}

/*
* Reply with the current odds. calculateOdds() is done else where (prior to calling this)
*/
Events.replyWithOdds = function(message) {
  var attachments = [];

  Events.race.runners.forEach(function(runner) {
    // add pretext to the first one
    var attachment = {
      "title": '#' + (runner.id+1) + ' ' + runner.name + ': ' + runner.oddsFraction,
      "color": runner.color
    }

    attachments.push(attachment);
  });

  BotkitController.bot.reply(message, {
    text: 'The Runners',
    attachments: attachments
  }, function(err, res) {
    if(err)
      BotkitController.bot.botkit.log('Failed to calculateOdds', err);
  });
}


