const { Events } = require('discord.js');
const { bot } = require('../server');
const configPreset = require('../config/main.json');

module.exports = {
    name: Events.Error,
    async execute(error) {
        // Send it to console
        console.error(error.stack);

        try {
            // Send it to my DM
            return bot.users.cache.get(configPreset.botInfo.ownerId).send({
                content: '**Error:** \n\n```javascript\n' + error.stack + '```'
            });
        } catch (error) { return }
    }
}