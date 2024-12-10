const { Events } = require('discord.js');
const { db } = require('../server');

module.exports = {
    name: Events.GuildBanAdd,
    once: false,
    execute: async (bannedUser) => {
        const request = await db.getConnection()

        let blacklistFind = await request.query(
            'SELECT userId FROM blacklists WHERE userId=?',
            [bannedUser.user.id]
        )

        blacklistFind = blacklistFind[0];

        if (blacklistFind[0] != undefined) {
            await db.query(
                `UPDATE blacklists SET joinedServerBan=? WHERE userId=?`,
                [blacklistFind[0]['joinedServerBan']++, bannedUser.user.id]
            );
        }

        db.releaseConnection(request);
    }
};