const { Events, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { db } = require('../server');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute: async (message) => {
        if (message.author.bot) return;

        const request = await db.getConnection()

        const levelFind = await request.query(
            'SELECT * FROM level WHERE userId=? AND guildId=?',
            [message.author.id, message.guild.id]
        )

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

        if (levelFind[0][0] == undefined) {
            await request.query(
                'INSERT INTO level (`guildId`, `userId`, `xp`) VALUES (?, ?, ?)',
                [message.guild.id, message.author.id, xpPerMessage]
            )
        } else {
            const xpIncrease = levelFind[0][0]['xp'] + xpPerMessage;

            await request.query(
                'UPDATE level SET `xp`=? WHERE guildId=? AND userId=?',
                [xpIncrease, message.guild.id, message.author.id]
            )

            //
            // Level up
            if (xpIncrease >= levelFind[0][0]['xpNext']) {
                const levelCurrent = levelFind[0][0]['level'] + 1;
                const xpCurrent = levelFind[0][0]['xp'];
                const xpNext = xpCurrent + increaseValue;
                let increaseValue = 250;

                if (levelCurrent >= 9) {
                    increaseValue = increaseValue + (100 * levelCurrent.toString().slice(1));
                } else if (levelCurrent >= 100) {
                    increaseValue = increaseValue + (100 * levelCurrent.toString().slice(2));
                }

                await request.query(
                    'UPDATE level SET `xpNext`=?, `level`=? WHERE guildId=? AND userId=?',
                    [xpNext, levelCurrent, message.guild.id, message.author.id]
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

                    if (levelFind[0][0]['messageAnnounce'] == 1) {
                        message.channel.send({
                            content: `Congrats ${message.author.toString()}, you leveled up! :partying_face:`,
                            files: [attachment]
                        })
                    }
                }
            }
        }

        return db.releaseConnection(request);
    }
}