const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language.js');
const { db } = require('../../server.js');

// Display the selected user avatar.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.commands.avatar.setup.name)
        .setNameLocalizations({
            "fr": fr.commands.avatar.setup.name,
            "de": de.commands.avatar.setup.name,
            "es-ES": sp.commands.avatar.setup.name,
            "nl": nl.commands.avatar.setup.name
        })
        .setDescription(en.commands.avatar.setup.description)
        .setDescriptionLocalizations({
            "fr": fr.commands.avatar.setup.description,
            "de": de.commands.avatar.setup.description,
            "es-ES": sp.commands.avatar.setup.description,
            "nl": nl.commands.avatar.setup.description
        })
        .addUserOption(option => option
            .setName(en.commands.avatar.setup.user.name)
            .setNameLocalizations({
                "fr": fr.commands.avatar.setup.user.name,
                "de": de.commands.avatar.setup.user.name,
                "es-ES": sp.commands.avatar.setup.user.name,
                "nl": nl.commands.avatar.setup.user.name
            })
            .setDescription(en.commands.avatar.setup.user.description)
            .setDescriptionLocalizations({
                "fr": fr.commands.avatar.setup.user.description,
                "de": de.commands.avatar.setup.user.description,
                "es-ES": sp.commands.avatar.setup.user.description,
                "nl": nl.commands.avatar.setup.user.description
            })
            .setRequired(false)),
    async execute(interaction) {
        const request = await db.getConnection();

        const loggingsFind = await request.query(
            `SELECT * FROM logging WHERE guildId=?`,
            [interaction.guild.id]
        );

        if (loggingsFind[0][0] != undefined) {
            //const language = loggingsFind[0][0]['language'];
            const userOption = interaction.options.getUser(en.commands.avatar.setup.user.name);
            const member = userOption ?
                userOption :
                interaction.user;

            const avatarEmbed = new EmbedBuilder()
                .setTitle(en.commands.avatar.response.title)
                .setImage(member.displayAvatarURL({ dynamic: true, size: 512 }))
                .setColor('Blue')

            await interaction.reply({
                embeds: [avatarEmbed]
            });
        }

        return db.releaseConnection(request);
    }
};