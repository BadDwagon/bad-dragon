const { Events, EmbedBuilder } = require('discord.js');
const { db } = require('../server');
const config = require('../config/main.json');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    execute: async (newMember) => {
        const request = await db.getConnection();

        const loggingFind = await request.query(
            `SELECT * FROM logging WHERE guildId=?`,
            [newMember.guild.id]
        )

        if (loggingFind[0][0] == undefined) return;

        const welcome_channelDestination = loggingFind[0][0]['welcome_channelDestination'];
        if (welcome_channelDestination) {
            // Check if the channel still exist
            const welcomeChannel = newMember.guild.channels.cache.get(welcome_channelDestination);
            if (!welcomeChannel) {
                return request.query(
                    `UPDATE logging SET welcome_channelDestination=?`,
                    [null]
                )
            };

            // Checking if the bot can send message in the channel
            if (!newMember.guild.members.me.permissionsIn(welcome_channelDestination).has(['SendMessages', 'ViewChannel']) || newMember.user.bot) return;

            // Sending the message
            await welcomeChannel.send({
                content: `${newMember.user.toString()} joined the server.`
            });
        };

        const welcome_roleAdd = loggingFind[0][0]['welcome_roleAdd'];
        if (welcome_roleAdd) {
            const botPermissionRole = newMember.guild.members.me.permissions.has('ManageRoles');
            const botPostion = newMember.roles.highest.position >= (await newMember.guild.members.fetch(config.botPrivateInfo.botId)).roles.highest.position;

            if (botPermissionRole & botPostion) {
                return newMember.roles.add(welcome_roleAdd);
            };
        };

        const status_Blacklist = loggingFind[0][0]['blacklist_status'];
        if (status_Blacklist == 1) {
            const status_BlacklistAutoban = loggingFind[0][0]['blacklist_autoBan'];
            const channelId_Blacklist = loggingFind[0][0]['blacklist_channelDestination'];

            const blacklistData = await
                request.query(`SELECT * FROM blacklists WHERE userId=?`,
                    [newMember.user.id]
                )

            if (blacklistData[0][0] == undefined) return;
            const userId = blacklistData[0][0]['userId'];
            const blacklistEmbed = new EmbedBuilder()

            // Check if the channel still exist
            const blacklistChannel = newMember.guild.channels.cache.get(channelId_Blacklist);
            if (!blacklistChannel) {
                await request.query(
                    `UPDATE loggings SET blacklist_channelDestination=?`,
                    [null]
                )
            };

            // Incrementing the join count in the database
            await request.query(
                `UPDATE blacklists SET joinedServer=? WHERE userId=?`,
                [blacklistData[0][0]['joinedServer']++, userId]
            );

            if (status_BlacklistAutoban != 0 && blacklistData[0][0]['risk'] >= status_BlacklistAutoban) {
                return newMember.guild.members.ban(userId, { reason: [`${blacklistData[0][0]['reason']} | Blacklist`] });
            }

            // Checking if the bot can send message in the channel
            if (channelId_Blacklist) {
                if (!newMember.guild.members.me.permissionsIn(channelId_Blacklist).has(['SendMessages', 'ViewChannel'])) return;

                // Changing embed color in terms of the risk
                switch (blacklistData[0]['risk']) {
                    case 0:
                        blacklistEmbed.setColor('57F287');
                        break;
                    case 1:
                        blacklistEmbed.setColor('FEE75C');
                        break;
                    case 2:
                        blacklistEmbed.setColor('ED4245');
                        break;
                };

                // Creating the embed and sending the message
                blacklistEmbed.setTitle('<:BanHammer:997932635454197790> New Alert');
                blacklistEmbed.addFields(
                    { name: 'User', value: newMember.user.toString(), inline: true },
                    { name: 'Reason', value: blacklistData[0][0]['reason'], inline: true },
                    { name: 'Evidence', value: blacklistData[0][0]['evidence'], inline: true }
                );
                blacklistEmbed.setFooter({
                    text: 'Id: ' + userId
                });
                blacklistEmbed.setTimestamp();

                await blacklistChannel.send({
                    embeds: [blacklistEmbed],
                });
            }
        }

        return db.releaseConnection(request);
    }
}