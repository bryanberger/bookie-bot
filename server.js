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
var admin = ['U0E8J127R','U0HNWMZJ7', 'U06BVLK8F'];

var race = {
  id: uuid.v4(),
  tax: 0.10, // 10% goes to the house :)
  winners: [-1, -1, -1],
  totalPool: 0,
  active: false,
  runners: [
    {id: 0, name: 'Secretariat', color: '#7ED321', odds: 0, oddsFraction: 0, pool: 0},
    {id: 1, name: 'Man O\' War', color: '#4A90E2', odds: 0, oddsFraction: 0, pool: 0},
    {id: 2, name: 'Seabiscuit', color: '#D52B3F', odds: 0, oddsFraction: 0, pool: 0},
    {id: 3, name: 'Ruffian', color: '#9641E1', odds: 0, oddsFraction: 0, pool: 0},
    {id: 4, name: 'Seattle Slew', color: '#EA8114', odds: 0, oddsFraction: 0, pool: 0}
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

    // calculate the odds in decimal and whole ratio (round down)
    // runner.odds = (race.totaPool - runner.pool) / runner.pool;

    // taxedPool / amount staked on horse = dividend per dollar bet
    if(runner.pool === 0) {
      runner.odds = 0;
      runner.oddsFraction = '0/5';

      return;
    }

    runner.odds = (race.totalPool - (race.totalPool * race.tax)) / runner.pool;
    runner.oddsFraction = (Math.floor(runner.odds * race.runners.length)) + '/' + race.runners.length;
  });
}

function payOut() {
  // TESTING
  race.winners = [0, 1, 2];

  // if the race is no longer active, there is a pool, and winners
  if(!race.active && race.totalPool > 0 && race.winners[0] > -1) {

    // loop over every player
    controller.storage.users.all(function(err, all_user_data) {
      all_user_data.forEach(function(user_data) {

        if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager') && user_data.wager.race_id === race.id) {
          // user placed a wager on this race
          var wager = user_data.wager;
          var payout = 0;

          switch(wager.type) {
            case 'win':
              if(wager.runner_id === race.winners[0]) {
                payout = (race.runners[wager.runner_id].odds * wager.amount) + wager.amount;
              }
            break;

            case 'place':
              payout = 0;
              //payout = (race.totalPool - (race.totalPool * race.tax)) - race.runners
            break;

            case 'show':
              payout = 0;
            break;
          }

          // deduct the payout from the payout pool
          race.totalPool -= payout;

          console.log(usernames[user_data.id], payout);

          // add the payout back to this user's object

          // notify the user of their earnings if > 0


// 1. Start with the total amount bet to place and subtract 15 percent for the takeout (the percentage withheld from the betting pool by the host track).
// 2. From that total, subtract the place money wagered on your horse and the highest amount of place money bet on another horse to get the profit from the place pool.
// 3. Split the profit amount between the two place horses.
// 4. Divide that amount by the number of $2 place bets on your horse.
// 5. Add $2, and you get your estimate place price.


        }

      });
    });

  }
}

// var json = JSON.parse(fs.readFileSync('data.json'));

// https://regex101.com/
// place a bet for $2 on horse #4 to win
// “$2 to win on #4.”
// \$?(\d+) to (win|place|show) on \#?(\d+)

// (\d+|\d{1,3},\d{3})(\.\d+)? on (horse|runner)? \#?(\d+) to (win|place|show)
// 5,000 on horse #15 to show
// 4000 on runner #1 to win
// 4,00.00 on horse 15 to place
controller.hears(
[
    '\\$?(\\d+) to (win|place|show) on \\#?(\\d+)',
    // '(\\$?\\d+|\\d{1,3},\\d{3})(\\.\\d+)? on (horse|runner)? \\#?(\\d+) to (win|place|show)'
],
'direct_message,direct_mention,mention', function(bot, message) {
    var username    = usernames[message.user];
    var wagerAmount = parseInt(message.match[1].replace(/\\$|,/g,''));
    var wagerType   = message.match[2];
    var runnerId    = parseInt(message.match[3]);

    console.log(username, wagerAmount, wagerType, runnerId);

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

    controller.storage.users.get(message.user, function(err, user_data) {
      var wager = {};

      if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
        wager = user_data.wager;
        bot.reply(message, ':x: <@' + username + '> You\'ve already bet: ```$' + wager.amount + ' on the #' + (wager.runner_id+1) + ' horse to ' + wager.type + '.```');
      } else {
        wager = {
          "race_id": race.id,
          "runner_id": runnerId-1,
          "type": wagerType,
          "amount": wagerAmount
        }

        controller.storage.users.save(
          {
            id: message.user,
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
      bot.reply(message, ':x: <@' + username + '> You\'ve already bet: ```$' + wager.amount + ' on the #' + (wager.runner_id+1)+ ' horse to ' + wager.type + '.```');
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
    if(admin.indexOf(message.user) === -1){
      return;
    }
    controller.storage.users.all(function(err, all_user_data) {
      var user_promises = all_user_data.map(function(user_data) {
        return new Promise((resolve, reject) => {
          if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
            delete user_data.wager
            resolve(true)
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
      // if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
      //   delete user_data.wager;

      //   controller.storage.users.save(user_data, function(err) {
      //     if(!err) {
      //       bot.reply(message, 'Cleared Queue.');
      //     } else {
      //       bot.botkit.log('Failed to clear the queue', err);
      //     }
      //   });
      // } else {
      //   bot.reply(message, 'Queue is already cleared...');
      // }

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

controller.hears(['start'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(admin.indexOf(message.user) !== -1) {
    race.active = true;
    calculateOdds(); // initial
    bot.reply(message, 'I\'m open for business, all bets are final. Place your bets!');
  }
});

controller.hears(['stop'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(admin.indexOf(message.user) !== -1) {
    race.active = false;
    bot.reply(message, 'Sorry, I\'m closed for business, no more bets...');
  }
});

controller.hears(['payout'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(admin.indexOf(message.user) !== -1) {
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
