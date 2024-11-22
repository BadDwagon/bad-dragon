const { Events, EmbedBuilder } = require('discord.js');
const { db } = require('../server');
const { botInfo, channelsId } = require('../config/main.json');

module.exports = {
    name: Events.GuildDelete,
    once: false,
    execute: async (guild) => {
        const request = await db.getConnection();

        // Update the guild database so the website knows the bot is in the server.
        const guildUpdate = await request.query(
            `SELECT * FROM guilds WHERE guildId=?`,
            [guild.id]
        )

        if (guildUpdate[0][0] == undefined) {
            await request.query(
                `INSERT INTO guilds (guildName, guildId, guildIcon, botIn) VALUES (?, ?, ?, ?)`,
                [guild.name, guild.id, guild.icon, 0, guild.memberCount]
            )
        } else {
            await request.query(
                `UPDATE guilds SET guildName=?, guildIcon=?, botIn=? WHERE guildId=?`,
                [guild.name, guild.icon, 0, guild.memberCount, guild.id]
            )
        }

        // Find a logging row for the server in the database
        const loggingFind = await request.query(
            `SELECT * FROM loggings WHERE guildId=?`,
            [guild.id]
        )

        if (loggingFind[0][0] == undefined) {
            await request.query(
                `INSERT INTO loggings (guildId) VALUES (?)`,
                [guild.id]
            )
        }

        let owner = await guild.fetchOwner();

        // Lookup if the owner of the server is blacklisted
        const blacklistFind = await request.query(
            `SELECT * FROM blacklists WHERE userId=?`,
            [owner.user.id]
        )

        blacklistFind[0][0] == undefined ?
            isBlacklisted = 'No' :
            isBlacklisted = 'Yes';

        let removeGuildEmbed = new EmbedBuilder()
            .setTitle('Bot Removed')
            .addFields(
                { name: 'Server Name', value: '`' + guild.name + '`', inline: true },
                { name: 'Server Id', value: '`' + guild.id + '`', inline: true },
                { name: 'Members', value: '`' + guild.memberCount.toString() + '`', inline: true },
                { name: '\u200b', value: '\u200b', inline: false },
                { name: 'Owner Name', value: '`' + owner.user.tag + '`', inline: true },
                { name: 'Owner Id', value: '`' + owner.user.id + '`', inline: true },
                { name: 'Blacklisted', value: '`' + isBlacklisted.toString() + '`', inline: true },
            )
            .setColor('Red');

        const removeGuildChannel = guild.client.guilds.cache.get(botInfo.supportServerId).channels.cache.get(channelsId.botRemoved)
        await removeGuildChannel.send({
            embeds: [removeGuildEmbed]
        });

        return db.releaseConnection(request);
    }
};