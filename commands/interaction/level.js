const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// Show the level of the member mentionned.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.level.default.name)
        .setNameLocalizations({
            "fr": fr.level.default.name,
            "de": de.level.default.name,
            "es-ES": sp.level.default.name,
            "nl": nl.level.default.name
        })
        .setDescription(en.level.default.description)
        .setDescriptionLocalizations({
            "fr": fr.level.default.description,
            "de": de.level.default.description,
            "es-ES": sp.level.default.description,
            "nl": nl.level.default.description
        })
        .addUserOption(option => option
            .setName(en.level.default.user.name)
            .setNameLocalizations({
                "fr": fr.level.default.user.name,
                "de": de.level.default.user.name,
                "es-ES": sp.level.default.user.name,
                "nl": nl.level.default.user.name
            })
            .setDescription(en.level.default.user.description)
            .setDescriptionLocalizations({
                "fr": fr.level.default.user.description,
                "de": de.level.default.user.description,
                "es-ES": sp.level.default.user.description,
                "nl": nl.level.default.user.description
            })
            .setRequired(false)),
    execute: async (interaction) => {
        const request = await db.getConnection()

        const user = interaction.options.getUser(en.staff.default.user.name);
        const userCheck = user ?
            user :
            interaction.user;

        const avatar = await loadImage(userCheck.displayAvatarURL({ extension: 'png' }));
        GlobalFonts.registerFromPath('./ressources/font/Poppins-SemiBold.ttf', 'Poppins')

        // Create the levelup picture
        const canvas = createCanvas(700, 250);
        const context = canvas.getContext('2d');

        const levelFind = await request.query(
            'SELECT * FROM level WHERE userId=? AND guildId=?',
            [userCheck.id, interaction.guild.id]
        )

        let levelCurrent = 0;
        let xpCanvas = 0;
        let xpText = 0;

        if (levelFind[0][0] != undefined) {
            levelCurrent = levelFind[0][0]['level'];
            xpCanvas = Math.floor((levelFind[0][0]['xp'] * 300) / levelFind[0][0]['xpNext']);
            xpText = Math.floor((levelFind[0][0]['xp'] * 100) / levelFind[0][0]['xpNext']);
        }


        context.font = '60px Poppins';
        context.fillStyle = '#00af00';
        context.fillText(levelCurrent.toString(), canvas.width / 1.575, canvas.height / 2)

        context.fillStyle = '#ffffff';
        // 1.8 is center for height
        context.fillText('Level', canvas.width / 2.5, canvas.height / 2)

        context.lineWidth = 12;
        context.strokeStyle = '#ffffff';
        context.strokeRect(canvas.width / 2.5, canvas.height / 1.6, 300, 0); // 100%

        context.lineWidth = 12;
        context.strokeStyle = '#00af00';
        context.strokeRect(canvas.width / 2.5, canvas.height / 1.6, xpCanvas, 0); // Current XP

        context.font = '10px Poppins';
        context.fillText(`${xpText.toString()}%`, canvas.width / 2.5, canvas.height / 1.45);

        //
        // Drawing profile picture
        context.beginPath();
        context.arc(125, 125, 100, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(avatar, 25, 25, 200, 200);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'leveling.png' });

        await interaction.reply({
            files: [attachment]
        })

        return db.releaseConnection(request);
    }
}