const { Events, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { db } = require('../server');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute: async (message) => {
        const request = await db.getConnection()

        const userSettingFind = await request.query(
            `SELECT * FROM user_settings WHERE userId=?`,
            [message.author.id]
        );

        // Look if the person refuses to get their data looked over.
        if (userSettingFind[0][0] != undefined && userSettingFind[0][0]['data_messageContent'] == 0) return db.releaseConnection(request);

        const levelFind = await request.query(
            'SELECT * FROM level WHERE userId=? AND guildId=?',
            [message.author.id, message.guild.id]
        )

        if (message.author.bot && levelFind[0][0] != undefined) {
            await request.query(
                'DELETE FROM level WHERE userId=?',
                [message.author.id]
            )

            return db.releaseConnection(request);
        } else if (message.author.bot) return db.releaseConnection(request);;

        const userFind = await request.query(
            'SELECT * FROM users WHERE userId=?',
            [message.author.id]
        );

        if (userFind[0][0] == undefined) {
            await request.query(
                'INSERT INTO users (`userId`, `userName`, `avatar`, `globalName`) VALUES (?, ?, ?, ?)',
                [message.author.id, message.author.username, message.author.avatar, message.author.globalName]
            );
        } else {
            await request.query(
                'UPDATE users SET `userName`=?, `globalName`=?, `avatar`=? WHERE userId=?',
                [message.author.username, message.author.globalName, message.author.avatar, message.author.id]
            );
        }

        const xpPerMessage = 5;

        //
        // Check if the user that sent the message got levels already in the guild
        // If they do, do other stuff.
        if (levelFind[0][0] == undefined) {
            await request.query(
                'INSERT INTO level (`guildId`, `userId`, `xp`) VALUES (?, ?, ?)',
                [message.guild.id, message.author.id, xpPerMessage]
            )
        } else {
            const xpIncrease = levelFind[0][0]['xp'] + xpPerMessage; // Increase level
            const levelCurrent = levelFind[0][0]['level'] + 1;

            await request.query(
                'UPDATE level SET `xp`=? WHERE guildId=? AND userId=?',
                [xpIncrease, message.guild.id, message.author.id]
            )

            const levelXpFind = await request.query(
                `SELECT * FROM level_xp WHERE level=? AND xp=?`,
                [levelCurrent, xpIncrease]
            );

            //
            // Level up
            if (levelXpFind[0][0] != undefined) {
                await request.query(
                    'UPDATE level SET `level`=? WHERE guildId=? AND userId=?',
                    [levelCurrent, message.guild.id, message.author.id]
                )

                if (message.guild.id === '1082103667181764659') {
                    // Create the levelup picture
                    const canvas = Canvas.createCanvas(700, 250);
                    const context = canvas.getContext('2d');

                    // Profile picture
                    const avatar = await Canvas.loadImage(message.author.displayAvatarURL({ extension: 'png' }));

                    Canvas.GlobalFonts.registerFromPath('./ressources/font/Poppins-SemiBold.ttf', 'Poppins')

                    context.font = '60px Poppins';
                    context.fillStyle = '#ffffff';
                    context.fillText(`Level ${levelCurrent}`, canvas.width / 2.5, canvas.height / 1.8);

                    context.beginPath();
                    context.arc(125, 125, 100, 0, Math.PI * 2, true);
                    context.closePath();
                    context.clip();

                    // Drawing profile picture
                    context.drawImage(avatar, 25, 25, 200, 200);

                    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'leveling.png' });

                    const perksFind = await request.query(
                        'SELECT * FROM level_perks WHERE guildId=? AND level=?',
                        [message.guild.id, levelCurrent]
                    )

                    if (perksFind[0][0] != undefined) {
                        if (!message.member.roles.cache.some(role => role.id === perksFind[0][0]['roleId'])) {
                            await message.member.roles.add(perksFind[0][0]['roleId'])
                        }
                    }

                    if (userSettingFind[0][0] == undefined || userSettingFind[0][0]['level_rankup'] == 0) {
                        message.channel.send({
                            content: `Congrats ${message.author.toString()}, you leveled up! :partying_face:\n\n-# You do not want to receive this message when you level up? You can disable it on the website : https://cheryl-bot.ca/settings`,
                            files: [attachment]
                        })
                    }
                }
            }
        }

        return db.releaseConnection(request);
    }
}