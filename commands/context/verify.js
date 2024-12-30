const { EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// This is a private commmand use on a one server only and only executable by me.

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName(en.context.verify.setup.name)
        .setNameLocalizations({
            "fr": fr.context.verify.setup.name,
            "de": de.context.verify.setup.name,
            "es-ES": sp.context.verify.setup.name,
            "nl": nl.context.verify.setup.name
        })
        .setType(ApplicationCommandType.User),
    execute: async (interaction) => {
        if (!interaction.guild.id === "1082103667181764659") return;

        const request = await db.getConnection();

        //
        // Check for the permission of the user executing the command.
        const missingRoleReply = en.global.userMissingRole;
        if (!interaction.member.roles.cache.some(role => role.id === '1191482864156557332')) {
            return interaction.reply({
                content: missingRoleReply.replace(/%Arg%/, '<@&1191482864156557332>'),
                ephemeral: true,
            });
        };

        //
        // Replying to the staff.
        const processVerify = en.context.verify.response.processVerify;
        await interaction.reply({
            content: processVerify.replace(/%Arg%/, interaction.targetMember.toString()),
            ephemeral: true,
        });

        //
        // Check if the user is already verified.
        const reason = en.context.verify.response.reason;
        const alreadyVerified = en.context.verify.response.alreadyVerified;
        if (interaction.targetMember.roles.cache.some(role => role.id === '1084970943820075050')) {
            return interaction.reply({
                content: alreadyVerified.replace(/%Arg%/, interaction.targetMember.toString()),
                ephemeral: true,
            });
        } else {
            await interaction.targetMember.roles.add(
                '1084970943820075050',
                reason.replace(/%Arg%/, interaction.user.username)
            );
        };

        //
        // Remove the un-verified role.
        if (interaction.targetMember.roles.cache.some(role => role.id === '1233066501825892383')) {
            await interaction.targetMember.roles.remove(
                '1233066501825892383',
                reason.replace(/%Arg%/, interaction.user.username)
            );
        };

        //
        // Updating the profile.
        const userFind = await request.query(
            'SELECT userId FROM users WHERE userId=?',
            [interaction.targetId]
        )

        if (userFind[0][0] == undefined) {
            await request.query(
                'INSERT INTO users (userId, userName, ageVerified) VALUES (?, ?, ?)',
                [interaction.targetId, interaction.targetMember.username, 1]
            )
        } else {
            await request.query(
                'UPDATE users SET ageVerified=? WHERE userId=?',
                [1, interaction.targetId]
            )
        }

        //
        // Sending message in channel.
        const verifiedEmbed = new EmbedBuilder()
            .addFields(
                {
                    name: 'Reaction Role',
                    value:
                        'There is multiple roles you can grab, some are just for fun and some that gives you access to channels :\n' +
                        '* <#1082135082246078464>\n' +
                        '  * This channel will give you access to fun roles that will only be there for yourself. You do not get access to more channels with these roles\n' +
                        '* <#1082135024264032297>\n' +
                        '  * This channel will give you access to NSFW categories. Including yiff and nudes.'
                }
            )
            .setColor('Blue')

        const channel18 = interaction.guild.channels.cache.get('1091220263569461349')
        const newVerification = en.context.verify.response.newVerification;
        await channel18.send({
            content: newVerification.replace(/%Arg%/, interaction.targetMember.toString()),
            embeds: [verifiedEmbed],
        });

        return db.releaseConnection(request);
    }
};