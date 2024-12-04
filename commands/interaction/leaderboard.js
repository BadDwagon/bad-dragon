const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// Show the leaderboard of the server.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.leaderboard.default.name)
        .setNameLocalizations({
            "fr": fr.leaderboard.default.name,
            "de": de.leaderboard.default.name,
            "es-ES": sp.leaderboard.default.name,
            "nl": nl.leaderboard.default.name
        })
        .setDescription(en.leaderboard.default.description)
        .setDescriptionLocalizations({
            "fr": fr.leaderboard.default.description,
            "de": de.leaderboard.default.description,
            "es-ES": sp.leaderboard.default.description,
            "nl": nl.leaderboard.default.description
        }),
    execute: async (interaction) => {
        const request = await db.getConnection()

        const embed = new EmbedBuilder()
            .setTitle(`Leaderboard of ${interaction.guild.name}`)
            .setDescription(`The full leaderboard is available [here](https://cheryl-bot.ca/leaderboard/guild?id=${interaction.guild.id})`)
            .setColor("Blue")

        const levelFind = await request.query(
            `SELECT * FROM level WHERE guildId=?`,
            [interaction.guild.id]
        );

        if (levelFind[0][0] != undefined) {
            const levelOrderFind = await request.query(
                `SELECT * FROM level ORDER BY xp DESC LIMIT 9 OFFSET 0`
            )

            for (leaderboard of levelOrderFind[0]) {
                embed.addFields(
                    { name: ` `, value: '<@' + leaderboard['userId'] + '> \n**Level** → `' + leaderboard['level'] + '` \n**XP** → `' + leaderboard['xp'] + '`', inline: true }
                );
            };

            await interaction.reply({
                embeds: [embed]
            });
        } else {
            await interaction.reply({
                content: "There is currently nobody with any level.",
                ephemeral: true,
            });
        }

        return db.releaseConnection(request);
    }
}