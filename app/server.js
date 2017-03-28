// example bot
import botkit from 'botkit';

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

var pubChannels = [];
var specChannel;

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.CS52_WHISPERBOT_TOKEN,
}).startRTM((err, bot, payload) => {
  if (err) { throw new Error(err); }
  pubChannels = payload.channels;
});

// prepare webhook
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
  bot.reply(message, 'Message me with the word \'post\' and I\'ll post anonymously in #general for you...');
});

controller.hears(['post'], ['direct_message'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.ask('Sure! Where do you want to post? (Don\'t include the # symbol)', (response, conversation) => {
      pubChannels.forEach((channel) => {
        if (channel.name === response) { specChannel = channel; }
      });
    });
    convo.ask('Okay! What do you want to post to #' + specChannel.name + '?', (response, conversation) => {
      bot.say({
        text: response.text,
        channel: specChannel.id,
      });
      convo.say('Okay, I just posted: \n' + response.text + '\nto #' + specChannel.name + '!');
      convo.next();
    });
  });
});

controller.on('direct_message', (bot, message) => {
  bot.reply(message, 'What? I didn\'t understand that...');
});

console.log('starting bot');
