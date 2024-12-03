const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { en, fr, de, sp, nl } = require('../../preset/language');

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
        }),
    execute: async (interaction) => {
        GlobalFonts.registerFromPath('./ressources/font/Poppins-SemiBold.ttf', 'Poppins')

        context.font = '60px Poppins';
        context.fillStyle = '#ffffff';

        const levelFind = await request.query(
            'SELECT * FROM level WHERE userId=? AND guildId=?',
            [interaction.user.id, message.guild.id]
        )

        levelFind ?
            levelCurrent = levelFind[0][0]['level'] :
            levelCurrent = 0;

        context.fillText(`Level ${levelCurrent}`, canvas.width / 2.5, canvas.height / 1.8)

        context.beginPath();
        context.arc(125, 125, 100, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();

        // Drawing profile picture
        context.drawImage(avatar, 25, 25, 200, 200);
    }
}