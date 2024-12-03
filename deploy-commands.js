const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const configPreset = require('./config/main');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandsFilter = fs.readdirSync(commandsPath).filter(file => file != 'message'); // Filter the message event out of it

for (folder of commandsFilter) {
	//
	// Find the folder after the filter
	const commandsPath = path.join(__dirname, `commands/${folder}`);
	const commandsFilter = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (file of commandsFilter) {
		const filesPath = path.join(commandsPath, file);
		const command = require(filesPath);
		console.log(filesPath)
		'data' in command && 'execute' in command ?
			commands.push(command.data.toJSON()) :
			console.log(`[WARNING] The command at ${filesPath} is missing a required "data" or "execute" property.`);
	}
}

const rest = new REST({
	version: '9'
}).setToken(configPreset.botPrivateInfo.token);

rest.put(Routes.applicationCommands(configPreset.botPrivateInfo.botId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);