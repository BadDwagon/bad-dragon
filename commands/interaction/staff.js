const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { bot } = require('../../server');
const configPreset = require('../../config/main.json');

// Display information about a user to know if they are a member of the staff of Cheryl or not.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.commands.staff.setup.name)
        .setNameLocalizations({
            "fr": fr.commands.staff.setup.name,
            "de": de.commands.staff.setup.name,
            "es-ES": sp.commands.staff.setup.name,
            "nl": nl.commands.staff.setup.name
        })
        .setDescription(en.commands.staff.setup.description)
        .setDescriptionLocalizations({
            "fr": fr.commands.staff.setup.description,
            "de": de.commands.staff.setup.description,
            "es-ES": sp.commands.staff.setup.description,
            "nl": nl.commands.staff.setup.description
        })
        .addUserOption(option => option
            .setName(en.commands.staff.setup.user.name)
            .setNameLocalizations({
                "fr": fr.commands.staff.setup.user.name,
                "de": de.commands.staff.setup.user.name,
                "es-ES": sp.commands.staff.setup.user.name,
                "nl": nl.commands.staff.setup.user.name
            })
            .setDescription(en.commands.staff.setup.user.description)
            .setDescriptionLocalizations({
                "fr": fr.commands.staff.setup.user.description,
                "de": de.commands.staff.setup.user.description,
                "es-ES": sp.commands.staff.setup.user.description,
                "nl": nl.commands.staff.setup.user.description
            })
            .setRequired(false)),
    execute: async (interaction) => {
        const request = await db.getConnection();

        const loggingsFind = await request.query(
            `SELECT * FROM loggings WHERE guildId=?`,
            [interaction.guild.id]
        );

        if (loggingsFind[0][0] != undefined) {
            //const language = loggingsFind[0][0]['language']; // Unused currently, but will be later.
            const user = interaction.options.getUser(en.commands.staff.setup.user.name);
            const userCheck = user ?
                user :
                interaction.user;
            const fetchGuild = interaction.client.guilds.cache.get(configPreset.botInfo.supportServerId);
            await fetchGuild.members.fetch();

            const staffGet = fetchGuild.members.cache.get(userCheck.id);
            const staffRole = staffGet ?
                staffGet.roles.cache.some(role => role.id === configPreset.staffRoleId.leadDeveloper) |
                staffGet.roles.cache.some(role => role.id === configPreset.staffRoleId.developer) |
                staffGet.roles.cache.some(role => role.id === configPreset.staffRoleId.staff) :
                false;

            //
            // Set the variable to it's setup value which is 'STAFF'.
            let staffRank = "STAFF";
            let thumbnailStaff = configPreset.other.isNotStaff;
            let isStaff = "isn't";
            let color = 'Red';

            //
            // Check if the user mentionned is a staff.
            if (staffRole) {
                thumbnailStaff = configPreset.other.isStaff;
                isStaff = "is";
                color = 'Green';

                //
                // Check for what rank as a staff member he is.
                if (staffGet.roles.cache.some(role => role.id === configPreset.staffRoleId.leadDeveloper)) {
                    staffRank = "LEAD DEVELOPER";
                } else if (staffGet.roles.cache.some(role => role.id === configPreset.staffRoleId.developer)) {
                    staffRank = "DEVELOPER";
                };
            };

            const embed = new EmbedBuilder()
                .setColor(color)
                .setThumbnail(thumbnailStaff)
                .setDescription(`${userCheck.toString()} ${isStaff} a **${staffRank}** of **${bot.user.username}**`);

            await interaction.reply({
                embeds: [embed],
            });
        };

        return db.releaseConnection(request);
    }
};