const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// Display information about a user.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.profile.default.name)
        .setNameLocalizations({
            "fr": fr.profile.default.name,
            "de": de.profile.default.name,
            "es-ES": sp.profile.default.name,
            "nl": nl.profile.default.name
        })
        .setDescription(en.profile.default.description)
        .setDescriptionLocalizations({
            "fr": fr.profile.default.description,
            "de": de.profile.default.description,
            "es-ES": sp.profile.default.description,
            "nl": nl.profile.default.description
        })
        .addUserOption(option => option
            .setName(en.profile.default.user.name)
            .setNameLocalizations({
                "fr": fr.profile.default.user.name,
                "de": de.profile.default.user.name,
                "es-ES": sp.profile.default.user.name,
                "nl": nl.profile.default.user.name
            })
            .setDescription(en.profile.default.user.description)
            .setDescriptionLocalizations({
                "fr": fr.profile.default.user.description,
                "de": de.profile.default.user.description,
                "es-ES": sp.profile.default.user.description,
                "nl": nl.profile.default.user.description
            })
            .setRequired(false))
        .addStringOption(option => option
            .setName(en.profile.default.choice.age.name)
            .setNameLocalizations({
                "fr": fr.profile.default.choice.age.name,
                "de": de.profile.default.choice.age.name,
                "es-ES": sp.profile.default.choice.age.name,
                "nl": nl.profile.default.choice.age.name
            })
            .setDescription(en.profile.default.choice.age.description)
            .setDescriptionLocalizations({
                "fr": fr.profile.default.choice.age.description,
                "de": de.profile.default.choice.age.description,
                "es-ES": sp.profile.default.choice.age.description,
                "nl": nl.profile.default.choice.age.description
            })
            .addChoices(
                { name: en.profile.default.choice.age.list.minor, value: "minor" },
                { name: en.profile.default.choice.age.list.adult, value: "adult" },
            )
            .setRequired(false)),
    execute: async (interaction) => {
        const ageOptions = interaction.options.getString(en.profile.default.choice.age.name);
        const user = interaction.options.getUser(en.profile.default.user.name);
        const profileEmbed = new EmbedBuilder()

        db.getConnection();

        // Change the variable user if it was mentionned or not, if not mentionned the target will be themselves.
        user ?
            userTarget = user :
            userTarget = interaction.user;

        const profileData = await db.query(`SELECT * FROM profiles WHERE userId=?`,
            [userTarget.id]);

        if (profileData[0] == undefined) {
            await db.query(`INSERT INTO profiles (userName, userId) VALUES (?, ?)`,
                [userTarget.username, userTarget.id]);
        };

        if (ageOptions) {
            profileEmbed.setDescription(en.profile.default.choice.message.option.embed.description);
            profileEmbed.addFields(
                { name: en.profile.default.choice.age, value: ageOptions, inline: true },
            );

            await db.query(`UPDATE profiles SET (age=?) WHERE (?)`,
                [ageOptions, interaction.user.id]);

            return interaction.reply({
                embeds: [optionEmbed],
                ephemeral: true
            });
        } else {
            // If no user mentionned return self
            if (user) {
                memberData = user;
                userData = user.id;
            } else {
                memberData = interaction.member;
                userData = interaction.user.id;
            };

            const member = interaction.guild.members.cache.get(memberData.id) || await interaction.guild.members.fetch(memberData.id).catch(error => { });

            // This code is very laggy, will need to be optimized

            profileEmbed.addFields(
                { name: en.profile.default.choice.message.option.embed.name, value: memberData.toString(), inline: true },
                { name: en.profile.default.choice.message.option.embed.id, value: "`" + memberData.id + "`", inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
            )
            profileEmbed.setThumbnail(memberData.displayAvatarURL())
            profileEmbed.setColor("Blue");

            profileData[0][0]['verified18'] === 1 ?
                isVerified18 = "Yes" :
                isVerified18 = "No";
            profileEmbed.addFields(
                { name: en.profile.default.choice.message.option.embed.age, value: "`" + profileData[0][0]['age'] + "`", inline: true },
                { name: en.profile.default.choice.message.option.embed.verified18, value: "`" + isVerified18 + "`", inline: true },
                { name: '\u200b', value: '\u200b', inline: true }
            );

            if (interaction.guild.members.cache.get(memberData.id)) {
                roleMap = member.roles.cache
                    .filter((roles) => roles.id !== interaction.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map((role) => role.toLocaleString())
                    .join(", ");
                profileEmbed.addFields(
                    { name: en.profile.default.choice.message.option.embed.roles, value: roleMap },
                );
            };

            await interaction.reply({
                embeds: [profileEmbed],
            });
        }

        return db.releaseConnection();
    }
};