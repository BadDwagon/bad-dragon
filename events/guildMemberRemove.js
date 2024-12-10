const { Events } = require('discord.js');
const { db } = require('../server');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    execute: async (leavingMember) => {
        const request = await db.getConnection();

        //
        // Send a message in the leaving channel mentionned.
        const loggingFind = await request.query(
            `SELECT * FROM loggings WHERE guildId=?`,
            [leavingMember.guild.id]
        )

        if (loggingFind[0][0] != undefined) {
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
                    content: `${leavingMember.user.toString()} left the server.`
                });
            }
        }

        //
        // Delete all tickets.
        const ticketFind = await request.query(
            `SELECT * FROM ticket WHERE userId=? AND guildId=?`,
            [leavingMember.user.id, leavingMember.guild.id]
        )

        if (ticketFind[0][0] != undefined) {
            for (i = 0; i <= 10; i++) {
                //
                // Delete the message of the ticket.
                const msg = leavingMember.guild.channels.cache.get(leavingMember.guild.id).messages(ticketFind[0][i]['messageId']);
                if (msg) msg.delete();

                //
                // Delete the ticket channel if there is one.
                const channel = leavingMember.guild.channels.cache.get(ticketFind[0][i]['channelId']);
                if (channel) channel.delete();
            }

            const ticketCountFind = await request.query(
                `SELECT * FROM ticket_count WHERE guildId=?`,
                [leavingMember.guild.id]
            );

            if (ticketCountFind[0][0] != undefined) {
                await request.query(
                    `UPDATE ticket SET count=? WHERE guildId=?`,
                    [ticketCountFind[0][0]['count'] - 1, leavingMember.guild.id]
                );
            }

            await request.query(
                `DELETE FROM ticket WHERE guildId=? AND userId=?`,
                [leavingMember.guild.id, leavingMember.user.id]
            );
        }

        return db.releaseConnection(request);
    }
};