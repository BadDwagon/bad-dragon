const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language.js');
const configPreset = require('../../config/main.json');
const { db } = require('../../server.js');

// Display a list of command that the bot as.

module.exports = {
  data: new SlashCommandBuilder()
    .setName(en.commands.help.setup.name)
    .setNameLocalizations({
      "fr": fr.commands.help.setup.name,
      "de": de.commands.help.setup.name,
      "es-ES": sp.commands.help.setup.name,
      "nl": nl.commands.help.setup.name
    })
    .setDescription(en.commands.help.setup.description)
    .setDescriptionLocalizations({
      "fr": fr.commands.help.setup.description,
      "de": de.commands.help.setup.description,
      "es-ES": sp.commands.help.setup.description,
      "nl": nl.commands.help.setup.description
    }),
  execute: async (interaction) => {
    const request = await db.getConnection();

    const loggingsFind = await request.query(
      `SELECT * FROM logging WHERE guildId=?`,
      [interaction.guild.id]
    );

    if (loggingsFind[0][0] != undefined) {
      //const language = loggingsFind[0][0]['language'];
      const helpEmbed = new EmbedBuilder()
        .setDescription(en.commands.help.response.description)
        .setColor("Blue")

      const helpButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel(en.global.button.discord)
            .setURL(configPreset.other.discordLink)
            .setStyle(ButtonStyle.Link),
        );

      await interaction.reply({
        embeds: [helpEmbed],
        components: [helpButton],
      });
    }

    return db.releaseConnection(request);
  }
};