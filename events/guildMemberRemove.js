const { Events } = require('discord.js');
const { db } = require('../server');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    execute: async (leavingMember) => {
        const request = await db.getConnection();

        //
        //
        const loggingFind = await request.query(
            `SELECT * FROM loggings WHERE guildId=?`,
            [leavingMember.guild.id]
        )

        if (!loggingFind[0][0] == undefined) {
            const channelId_Leaving = loggingFind[0][0]['leaving_channelDestination'];
            if (channelId_Leaving == null) return;

            const leavingChannel = leavingMember.guild.channels.cache.get(channelId_Leaving);
            if (!leavingChannel) {
                await request.query(
                    `UPDATE loggings SET leaving_channelDestination=?`,
                    [null]
                )
            } else {
                if (!leavingMember.guild.members.me.permissionsIn(channelId_Leaving).has(['SendMessages', 'ViewChannel']) | leavingMember.user.bot) return;

                await leavingChannel.send({
                    content: [`${leavingMember.user.toString()} left the server.`]
                });
            }
        }

        //
        // Delete all tickets.
        const ticketFind = await request.query(
            `SELECT * FROM ticket WHERE userId=? AND guildId=?`,
            [leavingMember.user.id, leavingMember.guild.id]
        )

        if (!ticketFind == undefined) {
            console.log(leavingMember.guild.channels.cache.get(leavingMember.guild.id).messages(ticket[0][0]['messageId']))

            await request.query(
                `DELETE FROM ticket WHERE guildId=? AND userId=?`,
                [leavingMember.guild.id, leavingMember.user.id]
            );
        }

        return db.releaseConnection(request);
    }
};