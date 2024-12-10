const { Events } = require('discord.js');
const { db } = require('../server');

module.exports = {
    name: Events.UserUpdate,
    once: false,
    execute: async (oldUpdate, newUpdate) => {
        const request = await db.getConnection();

        if (newUpdate.username !== oldUpdate.username) {
            await request.query(
                `UPDATE blacklists SET userTag=? WHERE userId=?`,
                [newUpdate.username, oldUpdate.id]);

            await request.query(
                `UPDATE blacklists SET staffTag=? WHERE staffId=? IN (staffId)`,
                [newUpdate.username, oldUpdate.id]);
        };

        return db.releaseConnection(request);
    }
};