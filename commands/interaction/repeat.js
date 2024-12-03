const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioResource, StreamType, AudioPlayer } = require('@discordjs/voice');
const { en, fr, de, sp, nl } = require('../../preset/language');
const tts = require('openai');

const player = new AudioPlayer();

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.repeat.default.name)
        .setNameLocalizations({
            "fr": fr.repeat.default.name,
            "de": de.repeat.default.name,
            "es-ES": sp.repeat.default.name,
            "nl": nl.repeat.default.name
        })
        .setDescription(en.repeat.default.description)
        .setDescriptionLocalizations({
            "fr": fr.repeat.default.description,
            "de": de.repeat.default.description,
            "es-ES": sp.repeat.default.description,
            "nl": nl.repeat.default.description
        })
        .addStringOption(option => option
            .setName(en.repeat.default.string.name)
            .setNameLocalizations({
                "fr": fr.repeat.default.string.name,
                "de": de.repeat.default.string.name,
                "es-ES": sp.repeat.default.string.name,
                "nl": nl.repeat.default.string.name
            })
            .setDescription(en.repeat.default.string.description)
            .setDescriptionLocalizations({
                "fr": fr.repeat.default.string.description,
                "de": de.repeat.default.string.description,
                "es-ES": sp.repeat.default.string.description,
                "nl": nl.repeat.default.string.description
            })
            .setRequired(false)),
    execute: async (interaction) => {
        const textOption = interaction.options.getString(en.repeat.default.string.name)
        // Find the voice channel in the server
        if (!interaction.guild.channels.cache.find(channel => channel.id === interaction.member.voice.channel.id)) {
            return interaction.reply({
                content: en.repeat.error.wrongGuild,
            })
        }

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
    }
}