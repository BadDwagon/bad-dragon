const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { fr, en, de, sp, nl } = require('../preset/language')

const configPreset = require("../config/main.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.ban.default.name)
        .setNameLocalizations({
            "fr": fr.ban.default.name,
            "de": de.ban.default.name,
            "es-ES": sp.ban.default.name,
            "nl": nl.ban.default.name
        })
        .setDescription(en.ban.default.description)
        .setDescriptionLocalizations({
            "fr": fr.ban.default.description,
            "de": de.ban.default.description,
            "es-ES": sp.ban.default.description,
            "nl": nl.ban.default.description
        })
        .addUserOption(option => option
            .setName(en.ban.default.user.name)
            .setNameLocalizations({
                "fr": fr.ban.default.user.name,
                "de": de.ban.default.user.name,
                "es-ES": sp.ban.default.user.name,
                "nl": nl.ban.default.user.name
            })
            .setDescription(en.ban.default.user.description)
            .setDescriptionLocalizations({
                "fr": fr.ban.default.user.description,
                "de": de.ban.default.user.description,
                "es-ES": sp.ban.default.user.description,
                "nl": nl.ban.default.user.description
            })
            .setRequired(true))
        .addStringOption(option => option
            .setName(en.ban.default.reason.name)
            .setNameLocalizations({
                "fr": fr.ban.default.reason.name,
                "de": de.ban.default.reason.name,
                "es-ES": sp.ban.default.reason.name,
                "nl": nl.ban.default.reason.name
            })
            .setDescription(en.ban.default.reason.description)
            .setDescriptionLocalizations({
                "fr": fr.ban.default.reason.description,
                "de": de.ban.default.reason.description,
                "es-ES": sp.ban.default.reason.description,
                "nl": nl.ban.default.reason.description
            })
            .setRequired(true)),
    execute: async (interaction) => {
        // Check for permission of the member and the bot
        let botCanBan = interaction.guild.members.me.permissions.has("BanMembers");
        let memberCanBan = interaction.guild.members.me.permissions.has("BanMembers");

        // If fails, send an error
        if (!botCanBan || !memberCanBan) {
            !botCanBan ? refusingAction = languageSet.default.botPermission.ban : null;
            !memberCanBan ? refusingAction = languageSet.default.userPermission.ban : null;

            return interaction.reply({
                content: messageRefusingAction,
                ephemeral: true,
            });
        };

        // Success on the permission now starting to gather info for the ban
        let user = interaction.options.getUser(en.ban.default.user.name);
        let member = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id).catch(error => { });
        let reason = interaction.options.getString(en.ban.default.reason.name);
        let banList = await interaction.guild.bans.fetch();
        let bannedUser = banList.find(user => user.id === user.id);
        let guild = bot.guilds.cache.get(interaction.guild.id);

        switch (user.id) {
            case (!user):
                return interaction.reply({
                    content: languageSet.default.unknownUser,
                    ephemeral: true,
                });
            case (interaction.member.id):
                return interaction.reply({
                    content: languageSet.blacklist.message.onWho.isThemself,
                    ephemeral: true,
                });
            case (bot.user.id):
                return interaction.reply({
                    content: languageSet.blacklist.message.onWho.isBot,
                    ephemeral: true,
                });
            case (interaction.guild.ownerId):
                return interaction.reply({
                    content: languageSet.ban.message.onWho.isOwner,
                    ephemeral: true,
                });
            case (!user.bannable):
                return interaction.reply({
                    content: languageSet.ban.message.onWho.isPunishable,
                    ephemeral: true,
                });
            case (guild.members.cache.find(m => m.id === user.id)?.id & member.roles.highest.position >= interaction.member.roles.highest.position):
                return interaction.reply({
                    content: languageSet.ban.message.onWho.isHigher,
                    ephemeral: true,
                });
            case (bannedUser):
                return interaction.reply({
                    content: languageSet.ban.message.onWho.isAlready,
                    ephemeral: true,
                });
            default:
                await user.send({
                    content: languageSet.ban.message.dm.you + " *" + interaction.guild.name + "* " + languageSet.ban.message.dm.for + " *" + reason + "* " + languageSet.ban.message.dm.by + " *" + interaction.user.tag + "*.",
                }).catch(() => { return });

                await interaction.guild.members.ban(user.id, { reason: [reason + " | " + interaction.user.tag] });

                await interaction.reply({
                    content: `*${user.tag}* ${languageSet.ban.message.success}`,
                });

                if (loggingData.channelId_Ban & interaction.guild.members.me.permissionsIn(loggingData.channelId_Ban).has(['SendMessages', 'ViewChannel'])) {
                    let logMessage = new EmbedBuilder()
                        .setTitle(languageSet.ban.message.embed.log.title)
                        .addFields(
                            { name: languageSet.ban.message.embed.log.fields.user, value: "``" + user.tag + "``" },
                            { name: languageSet.ban.message.embed.log.fields.reason, value: "``" + reason + "``" },
                            { name: languageSet.ban.message.embed.log.fields.mod, value: "``" + interaction.user.tag + "``" },
                        )
                        .setFooter(
                            { text: "ID: " + user.id }
                        )
                        .setTimestamp()
                        .setColor("Red");

                    let logChannel = interaction.guild.channels.cache.get(loggingData.channelId_Ban);

                    return logChannel.send({
                        embeds: [logMessage],
                    });
                } else return;
        };
    }
};