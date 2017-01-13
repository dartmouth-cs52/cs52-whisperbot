// example bot
import botkit from 'botkit';

//botkit controller
const controller = botkit.slackbot({
  debug: false,
});

const overheardsID = 'C02G9Q62H';

//initialize slackbot
const slackbot = controller.spawn({
  token: process.env.WHISPERBOT_TOKEN,
}).startRTM(err => {
  if (err) {throw new Error(err); }
});

//prepare webhook
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

controller.hears(['help'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Message me and I\'ll post anonymously in #overheards for you...');
});

controller.hears(['post'], ['direct_message'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('Sure! What do you want to post to overheards?', (response, convo) => {
      bot.say({
        text: response.text,
        channel: overheardsID
      });
      convo.say('Okay, I just posted: \n' + response.text + '\nto overheards!');
      convo.next();
    });
  });
});


console.log('starting bot');
