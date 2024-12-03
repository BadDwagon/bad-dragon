const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');
const configPreset = require('../../config/main');

// Display a list of command that the bot as.

module.exports = {
  data: new SlashCommandBuilder()
    .setName(en.help.default.name)
    .setNameLocalizations({
      "fr": fr.help.default.name,
      "de": de.help.default.name,
      "es-ES": sp.help.default.name,
      "nl": nl.help.default.name
    })
    .setDescription(en.help.default.description)
    .setDescriptionLocalizations({
      "fr": fr.help.default.description,
      "de": de.help.default.description,
      "es-ES": sp.help.default.description,
      "nl": nl.help.default.description
    }),
  execute: async (interaction) => {
    const helpEmbed = new EmbedBuilder()
      .setDescription(
        "The list of command is available on https://cheryl-bot.ca/commands.\n\n" +
        "There will also be a dashboard there in the future where users may adjust and personalize the bot."
      )
      .setColor("Blue")

    const helpButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel(en.default.button.discord)
          .setURL(configPreset.other.discordLink)
          .setStyle(ButtonStyle.Link),
      );

    return interaction.reply({
      embeds: [helpEmbed],
      components: [helpButton],
    });
  }
};