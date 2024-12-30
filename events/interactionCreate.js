const { Events } = require('discord.js');
const { en } = require('../preset/language')
const { db, consoleDate } = require('../server');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (!interaction.guild || !interaction.isCommand()) return;

        const request = await db.getConnection();

        const commandFind = await request.query(
            `SELECT * FROM command_functions WHERE name=?`,
            [interaction.commandName]
        )

        if (commandFind[0][0] == undefined) {
            await request.query(
                `INSERT INTO command_functions (name, isOn) VALUES (?, ?)`,
                [interaction.commandName, 1]
            )
        }

        interaction.options._hoistedOptions[0] != undefined ?
            option = interaction.options._hoistedOptions[0]['value'] :
            option = null;

        const commandStatsFind = await request.query(
            `SELECT * FROM command_stats WHERE name=? AND special_option=?`,
            [interaction.commandName, option]
        )

        if (commandStatsFind[0][0] == undefined) {
            await request.query(
                `INSERT INTO command_stats (name, special_option, usage_count) VALUES (?, ?, ?)`,
                [interaction.commandName, option, 1]
            )
        } else {
            await request.query(
                `UPDATE command_stats SET usage_count=?, special_option=? WHERE name=?`,
                [commandStatsFind[0][0]['usage_count'] + 1, option, interaction.commandName]
            )
        }

        if (commandFind[0]['isOn'] == 0 || !interaction.guild) {
            !interaction.guild ?
                refusingAction = en.global.serverOnly :
                refusingAction = en.global.commandDisabledGlobally;

            return interaction.reply({
                content: refusingAction,
                ephemeral: true,
            });
        };

        //
        // Execute the command
        try {
            const command = interaction.client.commands.get(interaction.commandName);
            await command.execute(interaction);
        } catch (error) {
            console.error(
                `${consoleDate} ${interaction.user.tag} (${interaction.user.id}) executed ${interaction.commandName}\n\n`,
                error
            )
        }

        return db.releaseConnection(request);
    },
};