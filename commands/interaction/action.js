const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { en, fr, de, sp, nl } = require('../../preset/language');
const { bot, db } = require('../../server');
const configPreset = require('../../config/main');
const profileInfo = require('../../config/profile');

// Do an action against the bot or another user.
// Note: There is NSFW related content in there.

module.exports = {
    data: new SlashCommandBuilder()
        .setName(en.action.default.name)
        .setNameLocalizations({
            'fr': fr.action.default.name,
            'de': de.action.default.name,
            'es-ES': sp.action.default.name,
            'nl': nl.action.default.name
        })
        .setDescription(en.action.default.description)
        .setDescriptionLocalizations({
            'fr': fr.action.default.description,
            'de': de.action.default.description,
            'es-ES': sp.action.default.description,
            'nl': nl.action.default.description
        })
        .addStringOption(option => option
            .setName(en.action.default.choice.name)
            .setNameLocalizations({
                'fr': fr.action.default.choice.name,
                'de': de.action.default.choice.name,
                'es-ES': sp.action.default.choice.name,
                'nl': nl.action.default.choice.name
            })
            .setDescription(en.action.default.choice.description)
            .setDescriptionLocalizations({
                'fr': fr.action.default.choice.description,
                'de': de.action.default.choice.description,
                'es-ES': sp.action.default.choice.description,
                'nl': nl.action.default.choice.description
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
            .setName(en.action.default.suggest.name)
            .setNameLocalizations({
                'fr': fr.action.default.suggest.name,
                'de': de.action.default.suggest.name,
                'es-ES': sp.action.default.suggest.name,
                'nl': nl.action.default.suggest.name
            })
            .setDescription(en.action.default.suggest.description)
            .setDescriptionLocalizations({
                'fr': fr.action.default.suggest.description,
                'de': de.action.default.suggest.description,
                'es-ES': sp.action.default.suggest.description,
                'nl': nl.action.default.suggest.description
            })
            .setRequired(false))
        .addUserOption(option => option
            .setName(en.action.default.member.name)
            .setNameLocalizations({
                'fr': fr.action.default.member.name,
                'de': de.action.default.member.name,
                'es-ES': sp.action.default.member.name,
                'nl': nl.action.default.member.name
            })
            .setDescription(en.action.default.member.description)
            .setDescriptionLocalizations({
                'fr': fr.action.default.member.description,
                'de': de.action.default.member.description,
                'es-ES': sp.action.default.member.description,
                'nl': nl.action.default.member.description
            })
            .setRequired(false)),
    async execute(interaction) {
        let optionChoice = interaction.options.getString(en.action.default.choice.name);
        let optionUser = interaction.options.getUser(en.action.default.member.name);
        let optionSuggest = interaction.options.getString(en.action.default.suggest.name);

        db.getConnection();

        let nsfwChoice = [
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

        if (optionSuggest) {
            // Check if the suggestion is an URL
            try {
                new URL(optionSuggest);
            } catch (error) {
                return interaction.reply({
                    content: en.action.message.error.wrongUrl,
                    ephemeral: true,
                });
            };

            // Check if the suggestion string is a valid format URL
            if (!['jpg', 'png', 'gif'].some(sm => optionSuggest.endsWith(sm))) {
                return interaction.reply({
                    content: en.action.message.error.wrongFormat,
                    ephemeral: true,
                });
            };

            // Check if image has already been suggested/added
            await db.query(`SELECT url FROM actionimages WHERE url=?`,
                [optionSuggest])
                .then((response) => {
                    // Check if the url already exist
                    if (response[0][0] != undefined) {
                        return interaction.reply({
                            content: en.action.message.error.alreadyExist,
                            ephemeral: true,
                        });
                    };

                    // Notify that the suggestion has been received
                    interaction.reply({
                        content: `${en.action.message.success.suggested} *${bot.user.username}*`,
                        ephemeral: true
                    })

                    // Creating the embed and button
                    let buttonSuggestion = new ActionRowBuilder()
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

                    let imageEmbed = new EmbedBuilder()
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

                    async function suggestionData(msg) {
                        await db.query(
                            'INSERT INTO actionimages (userId, messageId, category, url) VALUES (?, ?, ?, ?)',
                            [interaction.user.id, msg.id, optionChoice, optionSuggest]
                        );
                    };

                    // Change the channel ID in function of the choice (sfw or nsfw)
                    !optionChoice === !nsfwChoice.includes(optionChoice) ? channelSuggestId = configPreset.channelsId.nsfwSuggestion : channelSuggestId = configPreset.channelsId.sfwSuggestion;
                    let channelSuggest = interaction.client.guilds.cache.get(configPreset.botInfo.supportServerId).channels.cache.get(channelSuggestId);

                    // Check if the user that suggested is the bot owner
                    if (interaction.user.id === configPreset.botInfo.ownerId) {
                        imageEmbed.setColor('Green');

                        return channelSuggest.send({
                            embeds: [imageEmbed],
                        }).then(async (msg) => {
                            return suggestionData(msg);
                        });
                    } else {
                        return channelSuggest.send({
                            embeds: [imageEmbed],
                            components: [buttonSuggestion]
                        }).then(async (msg) => {
                            return suggestionData(msg);
                        });
                    };
                });
        } else {
            let userInteracter = interaction.user.toString();
            let userTarget = optionUser ? optionUser : bot.user;
            let pronounsLang = en.profile.default.choice.pronouns.list;

            if (nsfwChoice.includes(optionChoice) && !interaction.channel.nsfw) {
                return interaction.reply({
                    content: en.action.message.error.notNsfw,
                    ephemeral: true,
                });
            };

            await db.query('SELECT url FROM actionimages WHERE category=? ORDER BY RAND() LIMIT 1',
                [optionChoice]
            )
                .then(async (response) => {
                    if (response[0][0] == undefined) {
                        await interaction.reply({
                            content: `There is no image in the database for the following category: ${optionChoice}\n\nThe developers have been alerted!`,
                            ephemeral: true,
                        });

                        return notSend = true;
                    } else {
                        randomUrl = response[0][0]['url'];
                        return notSend = false;
                    }
                });

            if (notSend == true) return;

            await db.query('SELECT pronouns FROM profiles WHERE userId=?',
                [userTarget.id])
                .then((response) => {
                    if (response[0][0] == undefined) {
                        noun_target = pronounsLang.them;
                        adj_target = pronounsLang.their;
                    } else {
                        switch (response[0][0]['pronouns']) {
                            case (profileInfo.pronouns.th):
                                noun_target = pronounsLang.them;
                                adj_target = pronounsLang.their;
                                break;
                            case (profileInfo.pronouns.he):
                                noun_target = pronounsLang.him;
                                adj_target = pronounsLang.his;
                                break;
                            case (profileInfo.pronouns.sh):
                                noun_target = pronounsLang.her;
                                adj_target = pronounsLang.her;
                                break;
                            default:
                                noun_target = pronounsLang.them;
                                adj_target = pronounsLang.their;
                                break;
                        };
                    };
                });

            await db.query('SELECT userId, pronouns FROM profiles WHERE userId=?',
                [interaction.user.id])
                .then((response) => {
                    if (response[0][0] == undefined) {
                        noun_interaction = pronounsLang.them;
                        adj_interaction = pronounsLang.their;
                    } else {
                        switch (response[0][0]['pronouns']) {
                            case (profileInfo.pronouns.th):
                                noun_interaction = pronounsLang.them;
                                adj_interaction = pronounsLang.their;
                                break;
                            case (profileInfo.pronouns.he):
                                noun_interaction = pronounsLang.him;
                                adj_interaction = pronounsLang.his;
                                break;
                            case (profileInfo.pronouns.sh):
                                noun_interaction = pronounsLang.she;
                                adj_interaction = pronounsLang.her;
                                break;
                            default:
                                noun_interaction = pronounsLang.them;
                                adj_interaction = pronounsLang.their;
                                break;
                        };
                    };
                });

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

            const randomAnswer = sentence[Math.floor(Math.random() * sentence.length)];

            // Check what action have been removed image or message
            await db.query('SELECT action_status FROM loggings WHERE guildId=?',
                [interaction.guild.id])
                .then((response) => {
                    if (response[0][0] == undefined) return;

                    const actionType = response[0][0]['action_status'];
                    let isEphemeral = false;

                    switch (actionType) {
                        case 0:
                            reply = en.action.message.error.disable;
                            isEphemeral = true;
                            break;
                        case 1:
                            reply = randomAnswer;
                            break;
                        case 2:
                            reply = `[Source](${randomUrl})`;
                            break;
                        case 3:
                            reply = `${randomAnswer}\n\n[Source](${randomUrl})`;
                            break;
                    }

                    reply = reply.toString();

                    return interaction.reply({
                        content: reply,
                        ephemeral: isEphemeral,
                    });
                });

            return db.releaseConnection();
        };
    }
};