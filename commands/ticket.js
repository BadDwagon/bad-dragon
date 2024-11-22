const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fr, en, de, sp, nl } = require('../preset/language')

// Send a ticket message in the channel.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.ticket.default.name)
        .setNameLocalizations({
            "fr": fr.ticket.default.name,
            "de": de.ticket.default.name,
            "es-ES": sp.ticket.default.name,
            "nl": nl.ticket.default.name
        })
        .setDescription(en.ticket.default.description)
        .setDescriptionLocalizations({
            "fr": fr.ticket.default.description,
            "de": de.ticket.default.description,
            "es-ES": sp.ticket.default.description,
            "nl": nl.ticket.default.description
        }),
    execute: async (interaction) => {
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Age Verification')
                    .setCustomId('age-verification')
                    .setStyle(ButtonStyle.Success),
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Report')
                    .setCustomId('report')
                    .setStyle(ButtonStyle.Danger),
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Partnership')
                    .setCustomId('partnership')
                    .setStyle(ButtonStyle.Primary),
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Support')
                    .setCustomId('support')
                    .setStyle(ButtonStyle.Primary),
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Other')
                    .setCustomId('other')
                    .setStyle(ButtonStyle.Secondary),
            )

        const embed = new EmbedBuilder()
            .setTitle('Ticket System')
            .addFields(
                {
                    name: 'Age Verification',
                    value: 'To access the server and see the content, you must demonstrate that you are at least eighteen years old.\n'
                },
                {
                    name: 'Report',
                    value: 'To report a member or staff on this server, it can be for any reason. If the staff member is a supervisor and above, you will need to go directly into <@291262778730217472> private messages.'
                },
                {
                    name: 'Partnership',
                    value: "To become a partner with our server",
                },
                {
                    name: 'Support',
                    value: 'To receive support about the meetup, server related feature, etc.'
                },
                {
                    name: 'Other',
                    value: 'To receive help or anything else that does not belong in the above categories.'
                }
            )
            .setColor('Blue')

        interaction.channel.send({
            embeds: [embed],
            components: [button]
        })
    }
};