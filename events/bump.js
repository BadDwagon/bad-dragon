const { Events, EmbedBuilder } = require('discord.js');
const { en } = require('../preset/language');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute: async (message) => {
        try {
            let member = message.interaction.user.toString();

            if (message.embeds[0].description.startsWith('Bump')) {
                await message.channel.send({
                    content: `${en.bump.message.thanks_first} ${member} ${en.bump.message.thanks_second}`
                });

                return setTimeout(async () => {
                    let bumpTimeEmbed = new EmbedBuilder()
                        .setTitle(en.bump.message.embed.title)
                        .setURL(`https://disboard.org/server/${message.guild.id}`)
                        .setDescription(en.bump.message.embed.description)
                        .setColor('Blue');

                    return message.channel.send({
                        content: `${member}`,
                        embeds: [bumpTimeEmbed]
                    });
                }, 7200000);
            };
        } catch (error) { return }
    }
};