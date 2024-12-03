const { EmbedBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// This is a private commmand use on a one server only and only executable by me.

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName(en.verify.default.name)
        .setNameLocalizations({
            "fr": fr.verify.default.name,
            "de": de.verify.default.name,
            "es-ES": sp.verify.default.name,
            "nl": nl.verify.default.name
        })
        .setType(ApplicationCommandType.User),
    execute: async (interaction) => {
        if (!interaction.guild.id === "1082103667181764659") return;

        const request = await db.getConnection();

        //
        // Check for the permission of the user executing the command.
        if (!interaction.member.roles.cache.some(role => role.id === '1191482864156557332')) {
            return interaction.reply({
                content: "You do not have the permission to do that.",
                ephemeral: true,
            });
        }

        //
        // Check if the user is already verified.
        if (interaction.targetMember.roles.cache.some(role => role.id === '1084970943820075050')) {
            return interaction.reply({
                content: `${interaction.targetMember.toString()} is already verified.`,
                ephemeral: true,
            });
        }

        //
        // Check for the roles that the member has.
        let reason = `User verified by ${interaction.user.tag}.`

        if (!interaction.targetMember.roles.cache.some(role => role.id === '1084970943820075050')) {
            await interaction.targetMember.roles.add(
                '1084970943820075050',
                reason
            )
        } else if (interaction.targetMember.roles.cache.some(role => role.id === '1233066501825892383')) {
            await interaction.targetMember.roles.remove(
                '1233066501825892383',
                reason
            )
        }

        //
        // Replying to the staff.
        await interaction.reply({
            content: `Currently trying to verify ${interaction.targetMember.toString()}.`,
            ephemeral: true,
        });

        //
        // Updating the profile.
        const profileFind = await request.query(
            'SELECT userId FROM profiles WHERE userId=?',
            [interaction.targetId]
        )

        if (profileFind[0][0] == undefined) {
            await request.query(
                'INSERT INTO profiles (userId, userName, verified18) VALUES (?, ?, ?)',
                [interaction.targetId, interaction.targetMember.username, 1]
            )
        } else {
            await request.query(
                'UPDATE profiles SET verified18=? WHERE userId=?',
                [1, interaction.targetId]
            )
        }

        //
        // Sending message in channel.
        const verifiedEmbed = new EmbedBuilder()
            .addFields(
                {
                    name: 'Auto-Role',
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
        await channel18.send({
            content: `${interaction.targetMember.toString()} just got verified! Please make him feel welcomed~`,
            embeds: [verifiedEmbed],
        });

        //
        // Modifying the reply to alert the staff it is done.
        await interaction.deferReply({
            content: `You successfully verified ${interaction.targetMember.toString()}'s age.`,
            ephemeral: true,
        });

        return db.releaseConnection(request);
    }
};