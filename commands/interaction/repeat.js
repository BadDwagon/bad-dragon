const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioResource, StreamType, AudioPlayer } = require('@discordjs/voice');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { db } = require('../../server.js');
const tts = require('openai');

const player = new AudioPlayer();

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.commands.repeat.setup.name)
        .setNameLocalizations({
            "fr": fr.commands.repeat.setup.name,
            "de": de.commands.repeat.setup.name,
            "es-ES": sp.commands.repeat.setup.name,
            "nl": nl.commands.repeat.setup.name
        })
        .setDescription(en.commands.repeat.setup.description)
        .setDescriptionLocalizations({
            "fr": fr.commands.repeat.setup.description,
            "de": de.commands.repeat.setup.description,
            "es-ES": sp.commands.repeat.setup.description,
            "nl": nl.commands.repeat.setup.description
        })
        .addStringOption(option => option
            .setName(en.commands.repeat.setup.string.name)
            .setNameLocalizations({
                "fr": fr.commands.repeat.setup.string.name,
                "de": de.commands.repeat.setup.string.name,
                "es-ES": sp.commands.repeat.setup.string.name,
                "nl": nl.commands.repeat.setup.string.name
            })
            .setDescription(en.commands.repeat.setup.description)
            .setDescriptionLocalizations({
                "fr": fr.commands.repeat.setup.string.description,
                "de": de.commands.repeat.setup.string.description,
                "es-ES": sp.commands.repeat.setup.string.description,
                "nl": nl.commands.repeat.setup.string.description
            })
            .setRequired(false)),
    execute: async (interaction) => {
        const request = await db.getConnection();

        const loggingsFind = await request.query(
            `SELECT * FROM loggings WHERE guildId=?`,
            [interaction.guild.id]
        );

        if (loggingsFind[0][0] != undefined) {
            const language = loggingsFind[0][0]['language'];
            const textOption = interaction.options.getString(en.commands.repeat.setup.string.name)
            // Find the voice channel in the server
            if (!interaction.guild.channels.cache.find(channel => channel.id === interaction.member.voice.channel.id)) {
                return interaction.reply({
                    content: language.commands.repeat.error.wrongGuild,
                });
            };

            // Ready the player for audio
            const audio = tts.getVoiceStream(textOption)
            const audioResource = createAudioResource(audio, {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });

            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.member.voice.guild.voiceAdapterCreator,
            });

            const subscription = connection.subscribe(player);

            // subscription could be undefined if the connection is destroyed!
            if (subscription) {
                // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
                setTimeout(() => subscription.unsubscribe(), 5000);
            }

            player.play(audioResource);

            await interaction.reply({
                content: `>>> ${textOption}`
            })

            return setTimeout(() => connection.destroy(), 15000);
        };

        return db.releaseConnection(request);
    }
};