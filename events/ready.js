const { Events, ActivityType } = require('discord.js');
const { db, consoleDate, bot } = require('../server');
const configPreset = require('../config/main.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute() {
        bot.user.setStatus('dnd');

        let counter = 0;
        let request = await db.getConnection();

        setInterval(async () => {
            request = await db.getConnection();

            const blacklistFind = await request.query(
                `SELECT COUNT(*) FROM blacklists`
            )

            const status = [
                `${bot.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} Members!`,
                `${bot.guilds.cache.size} Servers!`,
                `${blacklistFind[0][0]['COUNT(*)']} Blacklisted Users!`,
                `Version ${configPreset.botInfo.version}`,
            ];

            counter == status.length ?
                counter = 0 :
                counter++;

            bot.user.setActivity(status[counter], { type: ActivityType.Watching });

            db.releaseConnection(request);
        }, 10000);

        bot.guilds.cache.forEach(async (guild) => {
            await request.query(
                `INSERT INTO guilds (guildName, guildId, guildIcon, botIn, memberCount) VALUES (?, ?, ?, ?, ?)`,
                [guild.name, guild.id, guild.icon, 1, guild.memberCount]
            ).catch(async (error) => {
                if (error.code === 'ER_DUP_ENTRY') {
                    await request.query(
                        `UPDATE guilds SET guildName=?, guildIcon=?, botIn=?, memberCount=? WHERE guildId=?`,
                        [guild.name, guild.icon, 1, guild.memberCount, guild.id]
                    )
                }
            });

            await request.query(
                `INSERT INTO loggings (guildId) VALUES (?)`,
                [guild.id]
            ).catch((error) => { })
        });

        console.log(`${consoleDate} The bot is ready!`);

        return db.releaseConnection(request);
    },
};