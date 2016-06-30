'use strict';

var BotkitController = require('./botkit_controller'),
                 os  = require('os'),
               path  = require('path'),
                  fs = require('fs'),
             Helpers = require('./helpers'),
              Events = require('./events');

// “$2 to win on #4.”
// \$?(\d+) to (win|place|show) on \#?(\d+)
// (\d+|\d{1,3},\d{3})(\.\d+)? on (horse|runner)? \#?(\d+) to (win|place|show)
// 5,000 on horse #15 to show
// 4000 on runner #1 to win
// 4,00.00 on horse 15 to place
BotkitController.controller.hears(
[
    '\\$?(\\d+) on \\#?(\\d+)',
    // '(\\$?\\d+|\\d{1,3},\\d{3})(\\.\\d+)? on (horse|runner)? \\#?(\\d+) to (win|place|show)'
],
'direct_message,direct_mention,mention', function(bot, message) {
    var username    = BotkitController.usernames[message.user];
    var wagerAmount = parseInt(message.match[1].replace(/\\$|,/g,''));
    //var wagerType   = message.match[2];
    var runnerId    = parseInt(message.match[2]);

    console.log(username, wagerAmount, runnerId);

    // race should be active
    if(!Events.race.active) {
      bot.reply(message, 'Sorry, I\'m closed for business, no more bets...');
      return;
    }

    // should have a validation controller here
    if(wagerAmount < 2) {
      bot.reply(message, 'The minimum bet is $2');
      return;
    }

    // should be an actual horse
    if(typeof Events.race.runners[runnerId-1] === 'undefined') {
      bot.reply(message, 'Please choose a valid runner');
      Events.replyWithOdds(message);
      return;
    }

    BotkitController.controller.storage.users.get(message.user, function(err, user_data) {
      var wager = {};

      if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
        wager = user_data.wager;
        bot.reply(message, ':x: <@' + username + '> You\'ve already bet: ```$' + wager.amount + ' on the #' + (wager.runner_id+1) + ' horse to win.```');
      } else {
        wager = {
          "race_id": Events.race.id,
          "runner_id": runnerId-1,
          "amount": wagerAmount
        }

        BotkitController.controller.storage.users.save(
          {
            id: message.user,
            username: username,
            wager: wager
          }, function(err) {
            Events.placeBet(wager);

            if(err)
              bot.botkit.log('Failed to place bet', err);
          });

        BotkitController.controller.storage.users.get(message.user, function(err, user) {
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

BotkitController.controller.hears(['can i place a bet', 'can i place a bet?', 'can i bet', 'can i bet?', 'bets?'],
'direct_message,direct_mention,mention', function(bot, message) {

  var username = BotkitController.usernames[message.user];

  BotkitController.controller.storage.users.get(message.user, function(err, user_data) {

    if(!Events.race.active) {
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


BotkitController.controller.hears(['races'],
'direct_message,direct_mention,mention', function(bot, message) {

  var username = BotkitController.usernames[message.user];

  if(Events.race.active) {
    replyWithOdds(message);
  } else {
    bot.reply(message, '<@' + username + '> there are no races going on right now...');
  }

});

/*
* Helpers
*
*/

BotkitController.controller.hears(['cq'],
  'direct_message,direct_mention,mention', function(bot, message) {
    if(!Events.isAdmin(message)){
      return;
    }
    BotkitController.controller.storage.users.all(function(err, all_user_data) {
      var user_promises = all_user_data.map(function(user_data) {
        return new Promise((resolve, reject) => {
          if('undefined' !== typeof user_data && user_data.hasOwnProperty('wager')) {
            delete user_data.wager;
            BotkitController.controller.storage.users.save(user_data, function(err) {
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

BotkitController.controller.hears(['thanks', 'ty', 'thx'],
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

BotkitController.controller.hears(['open'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(Events.isAdmin(message)) {
    Events.race.active = true;
    Events.calculateOdds(); // initial
    bot.reply(message, 'I\'m open for business, all bets are final. Place your bets!');
  }
});

BotkitController.controller.hears(['close'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(Events.isAdmin(message)) {
    Events.race.active = false;
    bot.reply(message, 'Sorry, I\'m closed for business, no more bets...');
  }
});

BotkitController.controller.hears(['payout'],
'direct_message,direct_mention,mention',function(bot, message) {
  if(Events.isAdmin(message)) {
    Events.payOut();
  }
});

BotkitController.controller.hears(['odds', 'runners', 'stakes', 'stake', 'the field'],
'direct_message,direct_mention,mention',function(bot, message) {
  Events.calculateOdds();
  Events.replyWithOdds(message);
});

/*
* Build a better help command
*/
BotkitController.controller.hears(['help'],
'direct_message,direct_mention,mention',function(bot, message) {
  bot.reply(message,'```Example bet: $2 to win on #4.```');
});

/*
* Uptime
*/
BotkitController.controller.hears(['uptime','identify yourself','who are you','what is your name'],
'direct_message,direct_mention,mention',function(bot, message) {
    var hostname = os.hostname();
    var uptime = Helpers.formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');
});
