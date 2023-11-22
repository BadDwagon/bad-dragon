const { ActionRowBuilder, ButtonStyle, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Color = require("../config/color.json");
const Message = require("../config/message.json");
const Config = require("../config/config.json");
const LanguageFR = require("../languages/fr.json");
const LanguageEN = require("../languages/en.json");
const LanguageDE = require("../languages/de.json");
const LanguageSP = require("../languages/sp.json");
const LanguageNL = require("../languages/nl.json");

const fr = LanguageFR.ticket;
const en = LanguageEN.ticket;
const de = LanguageDE.ticket;
const sp = LanguageSP.ticket;
const nl = LanguageNL.ticket;

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.Name)
        .setNameLocalizations({
            fr: fr.Name,
            de: de.Name,
            SpanishES: sp.Name,
            nl: nl.Name
        })
        .setDescription(en.Description)
        .setDescriptionLocalizations({
            fr: fr.Description,
            de: de.Description,
            SpanishES: sp.Description,
            nl: nl.Description
        }),
    execute: async (interaction, bot, sequelize, Sequelize) => {
        try {
            if (!interaction.user.id === "291262778730217472") return;

            if (!interaction.guild) {
                return interaction.reply({
                    content: "Use this command inside a server only!"
                });
            };

            const CommandFunction = sequelize.define("CommandFunction", {
                name: {
                    type: Sequelize.STRING,
                },
                value: {
                    type: Sequelize.STRING,
                },
            });

            const FindCommand = await CommandFunction.findOne({ where: { name: en.Name } });
            const MessageReason = require("../config/message.json");

            if (FindCommand) {
                if (FindCommand.value === "Disable") {
                    return interaction.reply({
                        content: MessageReason.CommandDisabled,
                        ephemeral: true,
                    });
                };
            };

            /*const Ticket = sequelize.define("Ticket", {
                GuildID: {
    type: Sequelize.STRING,
  },
  Name: {
    type: Sequelize.STRING,
  },
  MessageID: {
    type: Sequelize.STRING,
  },
  ChannelID: {
    type: Sequelize.STRING,
  },
  Description: {
    type: Sequelize.STRING,
  },
  Author: {
    type: Sequelize.STRING,
  },
            });

            let TicketData = await Ticket.findOne({ where: { GuildID: interaction.guild.id } });*/

            if (interaction.member.permissions.has("ManageChannels")) {
                if (interaction.guild.members.me.permissions.has("ManageChannels")) {
                    let Embed = new EmbedBuilder()
                        .setTitle("Create a Ticket")
                        .setDescription("Need help with anything? Or you would like to simply create a ticket to ask a question? Select your reason below!")
                        .setColor(Color.Blue)

                    const menuTicket = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('age_verification')
                                .setLabel('Age Verification')
                                .setStyle(ButtonStyle.Success)
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('report')
                                .setLabel('Report')
                                .setStyle(ButtonStyle.Danger)
                        )
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('support')
                                .setLabel('Support')
                                .setStyle(ButtonStyle.Primary)
                        );

                    return interaction.channel.send({
                        embeds: [Embed],
                        components: [menuTicket],
                    });
                } else {
                    return interaction.reply({
                        content: "I need the following permission ``ManageChannels``.",
                        ephemeral: true,
                    });
                };
            } else {
                return interaction.reply({
                    content: "You cannot execute this command! You need the following permission ``ManageChannels``.",
                    ephemeral: true,
                });
            };
        } catch (error) {
            let fetchGuild = interaction.client.guilds.cache.get(Config.guildId);
            let CrashChannel = fetchGuild.channels.cache.get(Config.CrashChannel);
            console.log(error);

            return CrashChannel.send({ content: "**Error in the '" + en.Name + "' Command:**\n\n```javascript\n" + error + "```" });
        };
    }
};