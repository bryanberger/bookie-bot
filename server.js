'use strict';

var Botkit  = require('botkit'),
        os  = require('os'),
      path  = require('path'),
         fs = require('fs'),
       uuid = require('node-uuid');

require('dotenv').config();

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    debug: false,
    json_file_store: __dirname + '/botdata'
});

var usernames = {};

//Bryan, Zack, Anna, Graham
var admin = ['U0E8J127R', 'U0HNWMZJ7', 'U06BVLK8F'];

var race = {
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

var bot = controller.spawn({
    token: process.env.token
}).startRTM(function(err, bot) {
  // @ https://api.slack.com/methods/users.list
  bot.api.users.list({}, function (err, response) {
    if(err) {
      bot.botkit.log('Failed to get the user list', err);
    }

    if (response.hasOwnProperty('members') && response.ok) {
      var total = response.members.length;
      for (var i = 0; i < total; i++) {
        var member = response.members[i];
        usernames[member.id] = member.name;
      }
    }
  });
});

//function checks to see if user is admin
function isAdmin(message) {
  return admin.indexOf(message.user) !== -1;
}

// @ http://www.wisegeek.com/how-do-they-determine-horse-racing-odds.htm
function placeBet(wager) {
  // get the runner the player is betting on
  var runner = race.runners[wager.runner_id];

  // increment the runner pool
  runner.pool += wager.amount;

  // increment the total pool
  race.totalPool += runner.pool;

  // re-calculate the odds
  calculateOdds();
}

function calculateOdds() {
  race.runners.forEach(function(runner) {

    if(runner.pool === 0) {
      runner.odds = runner.oddsFraction = 0;
      return;
    }

    var reducedFraction = reduceFraction(Math.floor(runner.odds * race.runners.length), race.runners.length);
    runner.odds = (race.totalPool - (race.totalPool * race.tax)) / runner.pool;
    runner.oddsFraction = reducedFraction[0] + '/' + reducedFraction[1];
  });
}

function payOut() {
  // TESTING
  race.winner_id = 0;

  console.log(race);

  // if the race is no longer active, there is a pool, and winners
  if(!race.active && race.totalPool > 0 && race.winner_id > -1) {

    console.log('active race with a pool');

    // loop over every player
    controller.storage.users.all(function(err, all_user_data) {
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

function reduceFraction(numerator, denominator) {
  var gcd = function gcd(a,b) {
    return b ? gcd(b, a%b) : a;
  };

  gcd = gcd(numerator,denominator);
  return [numerator/gcd, denominator/gcd];
}

// “$2 to win on #4.”
// \$?(\d+) to (win|place|show) on \#?(\d+)
// (\d+|\d{1,3},\d{3})(\.\d+)? on (horse|runner)? \#?(\d+) to (win|place|show)
// 5,000 on horse #15 to show
// 4000 on runner #1 to win
// 4,00.00 on horse 15 to place
controller.hears(
[
    '\\$?(\\d+) on \\#?(\\d+)',
    // '(\\$?\\d+|\\d{1,3},\\d{3})(\\.\\d+)? on (horse|runner)? \\#?(\\d+) to (win|place|show)'
],
'direct_message,direct_mention,mention', function(bot, message) {
    var username    = usernames[message.user];
    var wagerAmount = parseInt(message.match[1].replace(/\\$|,/g,''));
    //var wagerType   = message.match[2];
    var runnerId    = parseInt(message.match[2]);

    console.log(username, wagerAmount, runnerId);

    // race should be active
    if(!race.active) {
      bot.reply(message, 'Sorry, I\'m closed for business, no more bets...');
      return;
    }

    // should have a validation controller here
    if(wagerAmount < 2) {
      bot.reply(message, 'The minimum bet is $2');
      return;
    }

    // should be an actual horse
    if(typeof race.runners[runnerId-1] === 'undefined') {
      bot.reply(message, 'Please choose a valid runner');
      replyWithOdds(message);
      return;
    }

    controller.storage.users.get(message.user, function(err, user_data) {
      var wager = {};

      if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
        wager = user_data.wager;
        bot.reply(message, ':x: <@' + username + '> You\'ve already bet: ```$' + wager.amount + ' on the #' + (wager.runner_id+1) + ' horse to win.```');
      } else {
        wager = {
          "race_id": race.id,
          "runner_id": runnerId-1,
          "amount": wagerAmount
        }

        controller.storage.users.save(
          {
            id: message.user,
            username: username,
            wager: wager
          }, function(err) {
            placeBet(wager);

            if(err)
              bot.botkit.log('Failed to place bet', err);
          });

        controller.storage.users.get(message.user, function(err, user) {
            var msg = ':white_check_mark: Sure thing, your bet has been placed.';

            if (user && user.name) {
                bot.reply(message, user.name + ', ' + msg);
            } else {
                bot.reply(message, msg);
            }
        });
      }
    });
});

controller.hears(['can i place a bet', 'can i place a bet?', 'can i bet', 'can i bet?', 'bets?'],
'direct_message,direct_mention,mention', function(bot, message) {

  var username = usernames[message.user];

  controller.storage.users.get(message.user, function(err, user_data) {

    if(!race.active) {
      bot.reply(message, '<@' + username + '> there are no races going on right now...');
      return;
    }

    if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
      var wager = user_data.wager;
      bot.reply(message, ':x: <@' + username + '> You\'ve already bet: ```$' + wager.amount + ' on the #' + (wager.runner_id+1)+ ' horse to win.```');
    } else {
      bot.reply(message, ':white_check_mark: Yes, <@' + username + '> I\'m taking bets!');
    }
  });

});


controller.hears(['races'],
'direct_message,direct_mention,mention', function(bot, message) {

  var username = usernames[message.user];

  if(race.active) {
    replyWithOdds(message);
  } else {
    bot.reply(message, '<@' + username + '> there are no races going on right now...');
  }

});

/*
* Helpers
*
*/

controller.hears(['cq'],
  'direct_message,direct_mention,mention', function(bot, message) {
    if(!isAdmin(message)){
      return;
    }
    controller.storage.users.all(function(err, all_user_data) {
      var user_promises = all_user_data.map(function(user_data) {
        return new Promise((resolve, reject) => {
          if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
            delete user_data.wager;
            controller.storage.users.save(user_data, function(err) {
              if(!err) {
                resolve(true);
              } else {
                resolve(false);
              }
            })
          } else {
            resolve(false)
          }
        })
      });
      Promise.all(user_promises).then((results) => {
        if(results.indexOf(true) > -1) {
          bot.reply(message, 'Cleared Queue.');
        } else {
          bot.reply(message, 'Queue is already cleared...');
        }
      }).catch((error) => {
        bot.botkit.log('Failed to clear the queue', err);
      })

    });
});

controller.hears(['thanks', 'ty', 'thx'],
'direct_message,direct_mention,mention',function(bot, message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'thumbsup',
  }, function(err, res) {
    if (err) {
      bot.botkit.log('Failed to add emoji reaction', err);
    }
  });
});

controller.hears(['open'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(isAdmin(message)) {
    race.active = true;
    calculateOdds(); // initial
    bot.reply(message, 'I\'m open for business, all bets are final. Place your bets!');
  }
});

controller.hears(['close'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(isAdmin(message)) {
    race.active = false;
    bot.reply(message, 'Sorry, I\'m closed for business, no more bets...');
  }
});

controller.hears(['payout'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(isAdmin(message)) {
    payOut();
  }
});

controller.hears(['odds', 'runners', 'stakes', 'stake', 'the field'],
'direct_message,direct_mention,mention',function(bot, message) {
  calculateOdds();
  replyWithOdds(message);
});

/*
* Reply with the current odds. calculateOdds() is done else where (prior to calling this)
*/
function replyWithOdds(message) {
  var attachments = [];

  race.runners.forEach(function(runner) {
    // add pretext to the first one
    var attachment = {
      "title": '#' + (runner.id+1) + ' ' + runner.name + ': ' + runner.oddsFraction,
      "color": runner.color
    }

    attachments.push(attachment);
  });

  bot.reply(message, {
    text: 'The Runners',
    attachments: attachments
  }, function(err, res) {
    if(err)
      bot.botkit.log('Failed to calculateOdds', err);
  });
}




/*
* Build a better help command
*/
controller.hears(['help'],
'direct_message,direct_mention,mention',function(bot, message) {
  bot.reply(message,'```Example bet: $2 to win on #4.```');
});

/*
* Uptime
*/
controller.hears(['uptime','identify yourself','who are you','what is your name'],
'direct_message,direct_mention,mention',function(bot, message) {
    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
