const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');

// Display the selected user avatar.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.avatar.default.name)
        .setNameLocalizations({
            "fr": fr.avatar.default.name,
            "de": de.avatar.default.name,
            "es-ES": sp.avatar.default.name,
            "nl": nl.avatar.default.name
        })
        .setDescription(en.avatar.default.description)
        .setDescriptionLocalizations({
            "fr": fr.avatar.default.description,
            "de": de.avatar.default.description,
            "es-ES": sp.avatar.default.description,
            "nl": nl.avatar.default.description
        })
        .addUserOption(option => option
            .setName(en.avatar.default.user.name)
            .setNameLocalizations({
                "fr": fr.avatar.default.user.name,
                "de": de.avatar.default.user.name,
                "es-ES": sp.avatar.default.user.name,
                "nl": nl.avatar.default.user.name
            })
            .setDescription(en.avatar.default.user.description)
            .setDescriptionLocalizations({
                "fr": fr.avatar.default.user.description,
                "de": de.avatar.default.user.description,
                "es-ES": sp.avatar.default.user.description,
                "nl": nl.avatar.default.user.description
            })
            .setRequired(false)),
    async execute(interaction) {
        let userOption = interaction.options.getUser(en.avatar.default.user.name);
        let member = userOption ? userOption : interaction.user;

        let avatarEmbed = new EmbedBuilder()
            .setTitle(`${en.avatar.message.embed.title} ${member.username}`)
            .setImage(member.displayAvatarURL({ dynamic: true, size: 512 }))
            .setColor('Blue')

        return interaction.reply({
            embeds: [avatarEmbed]
        });
    }
};