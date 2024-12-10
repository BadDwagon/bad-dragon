const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language.js');
const { bot, db } = require('../../server.js');
const configPreset = require('../../config/main.json');

// Do an action against the bot or another user.
// Note: There is NSFW related content in there.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.commands.action.setup.name)
        .setNameLocalizations({
            'fr': fr.commands.action.setup.name,
            'de': de.commands.action.setup.name,
            'es-ES': sp.commands.action.setup.name,
            'nl': nl.commands.action.setup.name
        })
        .setDescription(en.commands.action.setup.description)
        .setDescriptionLocalizations({
            'fr': fr.commands.action.setup.description,
            'de': de.commands.action.setup.description,
            'es-ES': sp.commands.action.setup.description,
            'nl': nl.commands.action.setup.description
        })
        .addStringOption(option => option
            .setName(en.commands.action.setup.string.choice.name)
            .setNameLocalizations({
                'fr': fr.commands.action.setup.string.choice.name,
                'de': de.commands.action.setup.string.choice.name,
                'es-ES': sp.commands.action.setup.string.choice.name,
                'nl': nl.commands.action.setup.string.choice.name
            })
            .setDescription(en.commands.action.setup.string.choice.description)
            .setDescriptionLocalizations({
                'fr': fr.commands.action.setup.string.choice.description,
                'de': de.commands.action.setup.string.choice.description,
                'es-ES': sp.commands.action.setup.string.choice.description,
                'nl': nl.commands.action.setup.string.choice.description
            })
            .setRequired(true)
            .addChoices(
                { name: 'Hug', value: 'hug' },
                { name: 'Kiss', value: 'kiss' },
                { name: 'Boop', value: 'boop' },
                { name: 'Lick', value: 'lick' },
                { name: 'Cuddle', value: 'cuddle' },
                { name: 'Yeet', value: 'yeet' },
                { name: 'Pat', value: 'pat' },
                { name: 'Bite', value: 'bite' },
                { name: 'Bonk', value: 'bonk' },
                { name: 'Fuck → male/female', value: 'fuckstraight' },
                { name: 'Suck → male/female', value: 'suckstraight' },
                { name: 'Ride → male/female', value: 'ridestraight' },
                { name: 'Fill → male/female', value: 'fillstraight' },
                { name: 'Eat → male/female', value: 'eatstraight' },
                { name: 'Fuck → male/male', value: 'fuckgay' },
                { name: 'Suck → male/male', value: 'suckgay' },
                { name: 'Ride → male/male', value: 'ridegay' },
                { name: 'Fill → male/male', value: 'fillgay' },
                { name: 'Eat → male/male', value: 'eatgay' },
            ))
        .addStringOption(option => option
            .setName(en.commands.action.setup.string.suggest.name)
            .setNameLocalizations({
                'fr': fr.commands.action.setup.string.suggest.name,
                'de': de.commands.action.setup.string.suggest.name,
                'es-ES': sp.commands.action.setup.string.suggest.name,
                'nl': nl.commands.action.setup.string.suggest.name
            })
            .setDescription(en.commands.action.setup.string.suggest.description)
            .setDescriptionLocalizations({
                'fr': fr.commands.action.setup.string.suggest.description,
                'de': de.commands.action.setup.string.suggest.description,
                'es-ES': sp.commands.action.setup.string.suggest.description,
                'nl': nl.commands.action.setup.string.suggest.description
            })
            .setRequired(false))
        .addUserOption(option => option
            .setName(en.commands.action.setup.user.name)
            .setNameLocalizations({
                'fr': fr.commands.action.setup.user.name,
                'de': de.commands.action.setup.user.name,
                'es-ES': sp.commands.action.setup.user.name,
                'nl': nl.commands.action.setup.user.name
            })
            .setDescription(en.commands.action.setup.user.description)
            .setDescriptionLocalizations({
                'fr': fr.commands.action.setup.user.description,
                'de': de.commands.action.setup.user.description,
                'es-ES': sp.commands.action.setup.user.description,
                'nl': nl.commands.action.setup.user.description
            })
            .setRequired(false)),
    async execute(interaction) {
        const optionChoice = interaction.options.getString(en.commands.action.setup.string.choice.name);
        const optionSuggest = interaction.options.getString(en.commands.action.setup.string.suggest.name);
        const optionUser = interaction.options.getUser(en.commands.action.setup.user.name);
        const nsfwChoice = [
            'fuckstraight',
            'fuckgay',
            'suckstraight',
            'suckgay',
            'ridestraight',
            'ridegay',
            'fillstraight',
            'fillgay',
            'eatstraight',
            'eatgay'
        ];

        const request = await db.getConnection();

        const loggingsFind = await request.query(
            `SELECT * FROM loggings WHERE guildId=?`,
            [interaction.guild.id]
        );

        if (loggingsFind[0][0] != undefined) {
            //const language = loggingsFind[0][0]['language'];

            if (optionSuggest) {
                //
                // Check if the suggestion is an URL
                try {
                    new URL(optionSuggest);
                } catch (error) {
                    return interaction.reply({
                        content: en.commands.action.response.suggest.wrongUrl,
                        ephemeral: true,
                    });
                };

                //
                // Check if the suggestion string is a valid format URL
                if (!['jpg', 'png', 'gif'].some(sm => optionSuggest.endsWith(sm))) {
                    return interaction.reply({
                        content: en.commands.action.response.suggest.wrongFormat,
                        ephemeral: true,
                    });
                };

                //
                // Check if image has already been suggested/added
                const actionImageFind = await request.query(
                    `SELECT url FROM actionimages WHERE url=?`,
                    [optionSuggest]
                );

                //
                // Check if the url already exist
                if (actionImageFind[0][0] != undefined) {
                    return interaction.reply({
                        content: en.commands.action.response.suggest.alreadyExist,
                        ephemeral: true,
                    });
                };

                //
                // Notify that the suggestion has been received
                await interaction.reply({
                    content: en.commands.action.response.suggest.success,
                    ephemeral: true,
                });

                //
                // Creating the embed and button
                const buttonSuggestion = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('acceptSuggestionAction')
                            .setLabel('Accept')
                            .setStyle(ButtonStyle.Success),
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('denySuggestionAction')
                            .setLabel('Deny')
                            .setStyle(ButtonStyle.Danger),
                    );

                const imageEmbed = new EmbedBuilder()
                    .addFields(
                        { name: 'Name', value: interaction.user.username, inline: true },
                        { name: 'ID', value: interaction.user.id, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Category', value: optionChoice, inline: true },
                        { name: 'Image URL', value: `[Source](${optionSuggest})`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },

                    )
                    .setImage(optionSuggest)
                    .setColor('Yellow');

                //
                // Check if the user that suggested is the bot owner
                !optionChoice === !nsfwChoice.includes(optionChoice) ?
                    channelSuggestId = configPreset.channelsId.nsfwSuggestion :
                    channelSuggestId = configPreset.channelsId.sfwSuggestion;
                const channelSuggest = interaction.client.guilds.cache.get(configPreset.botInfo.supportServerId).channels.cache.get(channelSuggestId);


                if (interaction.user.id === configPreset.botInfo.ownerId) {
                    imageEmbed.setColor('Green');

                    msg = await channelSuggest.send({
                        embeds: [imageEmbed],
                    });
                } else {
                    msg = await channelSuggest.send({
                        embeds: [imageEmbed],
                        components: [buttonSuggestion]
                    });
                };

                await request.query(
                    'INSERT INTO actionimages (userId, messageId, category, url) VALUES (?, ?, ?, ?)',
                    [interaction.user.id, msg.id, optionChoice, optionSuggest]
                );
            } else {
                if (nsfwChoice.includes(optionChoice) && !interaction.channel.nsfw) {
                    return interaction.reply({
                        content: en.commands.action.response.user.notNsfw,
                        ephemeral: true,
                    });
                };

                const actionImageFind = await request.query(
                    `SELECT url FROM actionimages WHERE category=? ORDER BY RAND() LIMIT 1`,
                    [optionChoice]
                );

                if (actionImageFind[0][0] != undefined) {
                    const userInteracter = interaction.user.toString();
                    const userTarget = optionUser ?
                        optionUser :
                        bot.user;
                    const noun_target = "them";
                    const adj_interaction = "their";

                    switch (optionChoice) {
                        case ('hug'):
                            const hug = [
                                `${userInteracter} approaches ${userTarget} gently and hugs ${noun_target} from behind!~`,
                                `${userInteracter} wraps ${adj_interaction} arms around ${userTarget} taking ${noun_target} into ${adj_interaction} warm embrace!~`,
                                `${userInteracter} jump on ${userTarget}'s back and hug ${noun_target} tightly!~`
                            ];
                            sentence = hug;
                            break;
                        case ('kiss'):
                            const kiss = [
                                `${userInteracter} approches slowly ${userTarget}'s face and gently kiss ${noun_target}!~`,
                                `${userInteracter} gets close to ${userTarget} and kiss ${noun_target}!~'`
                            ];
                            sentence = kiss;
                            break;
                        case ('boop'):
                            const boop = [
                                `${userInteracter} raises ${adj_interaction} paw and places it apon ${userTarget}'s snoot!~`,
                            ];
                            sentence = boop;
                            break;
                        case ('lick'):
                            const lick = [
                                `${userInteracter} gets really close to ${userTarget} face and lick ${noun_target}!~`,
                            ];
                            sentence = lick;
                            break;
                        case ('cuddle'):
                            const cuddle = [
                                `${userInteracter} approches ${userTarget} and pounces, cuddling the suprised floofer!~`,
                                `${userInteracter} join ${userTarget} and cuddle ${noun_target}!~`,
                            ];
                            sentence = cuddle;
                            break;
                        case ('yeet'):
                            const yeet = [
                                `${userInteracter} yeeted ${userTarget} into the stratosphere!`,
                                `${userInteracter} grabbed ${userTarget} and yeeted ${noun_target} 10 miles into the sky!`,
                                `${userInteracter} grabs ${userTarget} and throws ${noun_target} to Ohio!`
                            ];
                            sentence = yeet;
                            break;
                        case ('pat'):
                            const pat = [
                                `${userInteracter} rub ${userTarget} on the head!~`,
                                `${userInteracter} mess ${userTarget} hair!~`,
                                `${userInteracter} strokes ${userTarget} head, messing with ${adj_target} hair!~`
                            ];
                            sentence = pat;
                            break;
                        case ('bite'):
                            const bite = [
                                `${userInteracter} decided to bite ${userTarget} a little!~`,
                                `${userInteracter} bite ${userTarget} to taste ${noun_target}!~`,
                            ];
                            sentence = bite;
                            break;
                        case ('bonk'):
                            const bonk = [
                                `${userInteracter} swing a baseball bat on ${userTarget}'s head.Bonking ${noun_target}!~`
                            ];
                            sentence = bonk;
                            break;
                        case ('fuckstraight'):
                            const fuckStraight = [
                                `${userInteracter} fuck ${userTarget} pussy really hard~`,
                                `${userInteracter} thrust into ${userTarget} back and forth into ${adj_target} pussy making ${noun_target} all wet~`,
                            ];
                            sentence = fuckStraight;
                            break;
                        case ('fuckgay'):
                            const fuckGay = [
                                `${userInteracter} fuck ${userTarget} really hard into ${adj_target} ass~`,
                                `${userInteracter} thrust into ${userTarget} back and forth into ${adj_target} ass~`,
                            ];
                            sentence = fuckGay;
                            break;
                        case ('suckstraight'):
                            const suckStraight = [
                                `${userInteracter} sucked ${userTarget}'s dick~`,
                                `${userInteracter} enjoys ${userTarget}'s dick while sucking it~`,
                            ];
                            sentence = suckStraight;
                            break;
                        case ('eatstraight'):
                            const eatStraight = [
                                `${userInteracter} eat ${userTarget}'s ass~'`,
                            ];
                            sentence = eatStraight;
                            break;
                        case ('suckgay'):
                            const suckGay = [
                                `${userInteracter} sucked ${userTarget}'s dick~`,
                                `${userInteracter} enjoys ${userTarget}'s dick while sucking it~`,
                            ];
                            sentence = suckGay;
                            break;
                        case ('ridestraight'):
                            const rideStraight = [
                                `${userInteracter} ride ${userTarget}'s dick~'`,
                                `${userInteracter} enjoys ${userTarget}'s dick while riding it~`,
                            ];
                            sentence = rideStraight;
                            break;
                        case ('ridegay'):
                            const rideGay = [
                                `${userInteracter} ride ${userTarget}'s dick~'`,
                                `${userInteracter} enjoys ${userTarget}'s dick while riding it~`,
                            ];
                            sentence = rideGay;
                            break;
                        case ('fillstraight'):
                            const fillStraight = [
                                `${userInteracter} fills up ${userTarget}'s ass with ${adj_interaction} seed~`,
                                `${userInteracter} pushes ${adj_target} dick deep inside ${userTarget}'s ass, filling it up with ${adj_interaction} juicy cum~`,
                            ];
                            sentence = fillStraight;
                            break;
                        case ('fillgay'):
                            const fillGay = [
                                `${userInteracter} fills up ${userTarget}'s ass with ${adj_interaction} seed~`,
                                `${userInteracter} pushes ${adj_target} dick deep inside ${userTarget}'s ass, filling it up with ${adj_interaction} juicy cum~`,
                            ];
                            sentence = fillGay;
                            break;
                        case ('eatgay'):
                            const eatGay = [
                                `${userInteracter} eat ${userTarget}'s ass~`,
                            ];
                            sentence = eatGay;
                            break;
                    };

                    //
                    // Check what action have been removed image or message
                    const loggingsFind = await request.query(
                        `SELECT action_status FROM loggings WHERE guildId=?`,
                        [interaction.guild.id]
                    );

                    if (loggingsFind[0][0] != undefined) {
                        const randomAnswer = sentence[Math.floor(Math.random() * sentence.length)];
                        let isEphemeral = false;

                        switch (loggingsFind[0][0]['action_status']) {
                            case 0:
                                reply = en.commands.action.response.user.disable;
                                isEphemeral = true;
                                break;
                            case 1:
                                reply = randomAnswer;
                                break;
                            case 2:
                                reply = `[Source](${actionImageFind[0][0]['url']})`;
                                break;
                            default:
                                reply = `${randomAnswer}\n\n[Source](${actionImageFind[0][0]['url']})`;
                                break;
                        }

                        reply = reply.toString();

                        await interaction.reply({
                            content: reply,
                            ephemeral: isEphemeral,
                        });
                    }
                } else {
                    const replyString = en.commands.action.response.noImageFound;

                    await interaction.reply({
                        content: replyString.replace(/%Arg%/g, optionChoice),
                        ephemeral: true,
                    });
                };
            };
        };

        return db.releaseConnection(request);
    }
};