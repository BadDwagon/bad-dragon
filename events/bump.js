const { Events, EmbedBuilder } = require('discord.js');
const { en } = require('../preset/language');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute: async (message) => {
        if (message.embeds[0] == undefined) return;
        const member = message.interaction.user.toString();

        if (message.embeds[0].description.startsWith('Bump')) {
            const reply = en.events.bump.response.newTimer
            await message.channel.send({
                content: reply.replace(/%Arg%/, member)
            });

            setTimeout(async () => {
                const bumpTimeEmbed = new EmbedBuilder()
                    .setTitle(en.events.bump.response.newTimer.title)
                    .setURL(`https://disboard.org/server/${message.guild.id}`)
                    .setDescription(en.events.bump.response.newTimer.description)
                    .setColor('Blue');

                return message.channel.send({
                    content: member,
                    embeds: [bumpTimeEmbed]
                });
            }, 7200000);
        };
    }
};