const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// Display information about a user.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.commands.profile.setup.name)
        .setNameLocalizations({
            "fr": fr.commands.profile.setup.name,
            "de": de.commands.profile.setup.name,
            "es-ES": sp.commands.profile.setup.name,
            "nl": nl.commands.profile.setup.name
        })
        .setDescription(en.commands.profile.setup.description)
        .setDescriptionLocalizations({
            "fr": fr.commands.profile.setup.description,
            "de": de.commands.profile.setup.description,
            "es-ES": sp.commands.profile.setup.description,
            "nl": nl.commands.profile.setup.description
        })
        .addUserOption(option => option
            .setName(en.commands.profile.setup.user.name)
            .setNameLocalizations({
                "fr": fr.commands.profile.setup.user.name,
                "de": de.commands.profile.setup.user.name,
                "es-ES": sp.commands.profile.setup.user.name,
                "nl": nl.commands.profile.setup.user.name
            })
            .setDescription(en.commands.profile.setup.user.description)
            .setDescriptionLocalizations({
                "fr": fr.commands.profile.setup.user.description,
                "de": de.commands.profile.setup.user.description,
                "es-ES": sp.commands.profile.setup.user.description,
                "nl": nl.commands.profile.setup.user.description
            })
            .setRequired(false)),
    execute: async (interaction) => {
        const request = await db.getConnection();

        const loggingsFind = await request.query(
            `SELECT * FROM logging WHERE guildId=?`,
            [interaction.guild.id]
        );

        if (loggingsFind[0][0] != undefined) {
            //
            // Change the variable user if it was mentionned or not, if not mentionned the target will be themselves.
            const user = interaction.options.getUser(en.commands.profile.setup.user.name);
            user ?
                userTarget = user :
                userTarget = interaction.user;
            const member = interaction.guild.members.cache.get(userTarget.id) || await interaction.guild.members.fetch(userTarget.id).catch(error => { });

            //
            // Check if there is data from the users mentionned already in the users database.
            const usersData = await request.query(
                `SELECT * FROM users WHERE userId=?`,
                [userTarget.id]
            );

            if (usersData[0][0] == undefined) {
                await db.query(
                    `INSERT INTO users (userName, userId) VALUES (?, ?)`,
                    [userTarget.username, userTarget.id]
                );
            };

            usersData[0][0]['ageVerified'] == 1 ?
                isAgeVerified = "Yes" :
                isAgeVerified = "No";

            const embed = new EmbedBuilder()
                .setThumbnail(userTarget.displayAvatarURL())
                .setColor("Blue")
                .addFields(
                    { name: en.commands.profile.response.fields.name, value: userTarget.toString(), inline: true },
                    { name: en.commands.profile.response.fields.id, value: "`" + userTarget.id + "`", inline: true },
                    { name: en.commands.profile.response.fields.ageVerified, value: "`" + isAgeVerified + "`", inline: true },
                );

            if (interaction.guild.members.cache.get(userTarget.id)) {
                roleMap = member.roles.cache
                    .filter((roles) => roles.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map((role) => role.toLocaleString())
                    .join(", ");
                embed.addFields(
                    { name: en.commands.profile.response.fields.roles, value: roleMap },
                );
            };

            await interaction.reply({
                embeds: [embed],
            });
        };

        return db.releaseConnection(request);
    }
};