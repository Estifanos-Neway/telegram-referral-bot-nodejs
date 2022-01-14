# Telegram-Referral-Bot-NodeJS

<h3>Here you can get general configuration steps. If you need detailed configuration steps or have any questions, contact me through my <a href="mailto:estifanos.neway.d@gmail.com" target="_blank">email</a> or <a href="https://t.me/Estifanos_Neway" target="_blank">telegram account</a> at any time.</h3>
<h2>Configuration</h2>

- Place the code in a GitHub repository,
- Create a MongoDb cluster and get connection link (no need to create any database or collection),
- Create a telegram bot and get the bot token,
- EDIT THE variables.js FILE IN THE PROJECT ROOT DIRECTORY (THIS MUST BE DONE BEFORE THE FIRST DEPLOYMENT) the file has clear comments to help you on what to edit,
- Start the bot with an account that you want to be the bots admin and get the chat_id of that account,
- Create a NodeJS app on Heroku, connect the app with The GitHub repository and add the following to the apps environment variables (Config vars):
  - MongoDb credentials (&lt;username&gt;:&lt;password&gt;) as MONGODB_CREDENTIALS,
  - the bots token as BOT_TOKEN,
  - the admins chat_id as ADMINS_CHAT_ID.
- get the apps URL from Heroku and set the bots web hook to that URL,
- add the bot to the group and you should be ready to go.
  <h2>Usage</h2>
- You are not required to do anything after adding the bot to the group,
- The bot will notify the admin (the account whose user_id is set as the ADMINS_CHAT_ID) when a new member join the group chat,
- The bot will also send database _id of stored files and download link when new files are posted in the group.