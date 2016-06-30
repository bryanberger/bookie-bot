var Botkit  = require('botkit');

var BotkitController = module.exports;
require('dotenv').config();

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

BotkitController.controller = Botkit.slackbot({
    debug: false,
    json_file_store: __dirname + '/botdata'
});

BotkitController.usernames = {};

BotkitController.bot = this.controller.spawn({
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
        BotkitController.usernames[member.id] = member.name;
      }
    }
  });
});
