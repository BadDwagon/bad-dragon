const { AttachmentBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server');

// Show the level of the member mentionned.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.commands.level.setup.name)
        .setNameLocalizations({
            "fr": fr.commands.level.setup.name,
            "de": de.commands.level.setup.name,
            "es-ES": sp.commands.level.setup.name,
            "nl": nl.commands.level.setup.name
        })
        .setDescription(en.commands.level.setup.description)
        .setDescriptionLocalizations({
            "fr": fr.commands.level.setup.description,
            "de": de.commands.level.setup.description,
            "es-ES": sp.commands.level.setup.description,
            "nl": nl.commands.level.setup.description
        })
        .addUserOption(option => option
            .setName(en.commands.level.setup.user.name)
            .setNameLocalizations({
                "fr": fr.commands.level.setup.user.name,
                "de": de.commands.level.setup.user.name,
                "es-ES": sp.commands.level.setup.user.name,
                "nl": nl.commands.level.setup.user.name
            })
            .setDescription(en.commands.level.setup.user.description)
            .setDescriptionLocalizations({
                "fr": fr.commands.level.setup.user.description,
                "de": de.commands.level.setup.user.description,
                "es-ES": sp.commands.level.setup.user.description,
                "nl": nl.commands.level.setup.user.description
            })
            .setRequired(false)),
    execute: async (interaction) => {
        const request = await db.getConnection()

        const user = interaction.options.getUser(en.commands.staff.setup.user.name);
        const userCheck = user ?
            user :
            interaction.user;

        const avatar = await loadImage(userCheck.displayAvatarURL({ extension: 'png' }));
        GlobalFonts.registerFromPath('./ressources/font/Poppins-SemiBold.ttf', 'Poppins')

        //
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