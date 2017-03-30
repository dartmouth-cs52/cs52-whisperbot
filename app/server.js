// example bot
import botkit from 'botkit';

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

var users = [];
var dmContact;

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.CS52_WHISPERBOT_TOKEN,
}).startRTM((err, bot, payload) => {
  if (err) { throw new Error(err); }
  users = payload.users;
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
    convo.ask('Sure! Where do you want to post? (Use a # symbol!)', (response, conversation) => {
      const channelID = response.text.substring(2, 11);
      const channelName = response.text.substring(12, response.text.length - 1);
      convo.next();
      convo.ask('Okay! What do you want to post to ' + channelName + '?', (resp, conv) => {
        if (resp.subtype === 'file_share') {
          bot.say({
            text: resp.file.url_private,
            channel: channelID,
          });
          convo.say('Okay, I just posted your image to #' + channelName + '!');
          convo.next();
        }
        else {
          bot.say({
            text: resp.text,
            channel: channelID,
          });
          convo.say('Okay, I just posted: \n' + resp.text + '\nto #' + channelName + '!');
          convo.next();
        }
      });
    });
  });
});

controller.hears(['message'], ['direct_message'], (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    convo.next();
    convo.ask('Sure! Who do you want to message? (Be sure to use the @ symbol!)', (response, conversation) => {
      users.forEach((user) => {
        if (user.id === response.text.substring(2, 11)) {
          dmContact = user;
        }
      });
      convo.next();
      convo.ask('Okay! What do you want to say to @' + dmContact.name + '?', (resp, conv) => {
        bot.say({
          text: resp.text,
          channel: dmContact.id,
        });
        convo.say('Okay, I just messaged:\n' + resp.text + '\nto @' + dmContact.name + '!');
        convo.next();
      });
    });
  });
});

controller.on('direct_mention', (bot, message) => {});

controller.on('mention', (bot, message) => {});

controller.on('direct_message', (bot, message) => {
  bot.reply(message, 'What? I didn\'t understand that...');
});

console.log('starting bot');
