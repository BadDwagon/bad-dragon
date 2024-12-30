const { Events, EmbedBuilder } = require('discord.js');
const { db } = require('../server');
const { botInfo, channelsId } = require('../config/main.json');

module.exports = {
    name: Events.GuildCreate,
    once: false,
    execute: async (guild) => {
        const request = await db.getConnection()

        // Find the guild data in the database
        const guildFind = await request.query(
            `SELECT * FROM guilds WHERE guildId=?`,
            [guild.id]
        )

        if (guildFind[0][0] == undefined) {
            await request.query(
                `INSERT INTO guilds (guildName, guildId, guildIcon, botIn, memberCount) VALUES (?, ?, ?, ?, ?)`,
                [guild.name, guild.id, guild.icon, 1, guild.memberCount]
            )
        } else {
            await request.query(
                `UPDATE guilds SET guildName=?, guildIcon=?, botIn=?, memberCount=? WHERE guildId=?`,
                [guild.name, guild.icon, 1, guild.memberCount, guild.id]
            )
        }

        // Find logging data in database
        const loggingFind = await request.query(
            `SELECT * FROM logging WHERE guildId=?`,
            [guild.id]
        )

        if (loggingFind[0][0] == undefined) {
            await request.query(
                `INSERT INTO logging (guildId) VALUES (?)`,
                [guild.id]
            )
        }

        let owner = await guild.fetchOwner();

        // Lookup if the owner of the server is blacklisted
        const blacklistFind = await request.query(
            `SELECT userId FROM blacklists WHERE userId=?`,
            [owner.user.id]
        )

        blacklistFind[0][0] == undefined ?
            isBlacklisted = 'No' :
            isBlacklisted = 'Yes';

        let newGuildEmbed = new EmbedBuilder()
            .setTitle('Bot Added')
            .addFields(
                { name: 'Server Name', value: '`' + guild.name + '`', inline: true },
                { name: 'Server Id', value: '`' + guild.id + '`', inline: true },
                { name: 'Members', value: '`' + guild.memberCount.toString() + '`', inline: true },
                { name: '\u200b', value: '\u200b', inline: false },
                { name: 'Owner Name', value: '`' + owner.user.tag + '`', inline: true },
                { name: 'Owner Id', value: '`' + owner.user.id + '`', inline: true },
                { name: 'Blacklisted', value: '`' + isBlacklisted.toString() + '`', inline: true },
            )
            .setColor('Green');

        const guildCreateChannel = guild.client.guilds.cache.get(botInfo.supportServerId).channels.cache.get(channelsId.botAdded)
        await guildCreateChannel.send({
            embeds: [newGuildEmbed]
        });

        return db.releaseConnection(request);
    }
};