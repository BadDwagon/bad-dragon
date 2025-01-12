const {
  Client,
  Partials,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');
const {
  botPrivateInfo
} = require('./config/main.json');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const bot = new Client({
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});
const db = mysql.createPool({
  host: botPrivateInfo.database.host,
  port: botPrivateInfo.database.port,
  user: botPrivateInfo.database.username,
  password: botPrivateInfo.database.password,
  database: "cherylbo_servers",
  waitForConnections: true,
  connectionLimit: 100,
});

const date = new Date();
const consoleDate = `${date.toLocaleString()} ->`;

//
// Exporting vital parts of the code.
module.exports = { bot, date, consoleDate, db };

//
// Check if there is any error while loading the database.
db.on('error', (error) => {
  return console.error(`${consoleDate} MySQL error`, error);
});

//
// Check if there is any error while closing connection of the database.
db.on('close', (error) => {
  return console.error(`${consoleDate} MySQL close`, error);
});

bot.commands = new Collection();

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
    bot.commands.set(command.data.name, command);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (file of eventsFiles) {
  const filesPath = path.join(eventsPath, file);
  const event = require(filesPath);
  if (event.once) {
    bot.once(event.name, (...args) => event.execute(...args));
  } else {
    bot.on(event.name, (...args) => event.execute(...args));
  }
};

bot.on('interactionCreate', async (interaction) => {
  if (!interaction.guild) return;

  const request = await db.getConnection();

  //
  // Approving and Denying new action image buttons.
  async function actionButton() {
    const actionFind = await request.query(
      `SELECT * FROM actionimages WHERE messageId=?`,
      [interaction.message.id]
    )

    if (actionFind[0][0] == undefined) return db.releaseConnection(request);;

    userId = actionFind[0][0]['userId'];
    url = actionFind[0][0]['url'];
    category = actionFind[0][0]['category'];
    createdAt = actionFind[0][0]['createdAt'];

    let suggestionEmbed = new EmbedBuilder()
      .addFields(
        { name: 'User', value: `<@${userId}>`, inline: true },
        { name: 'Category', value: category, inline: true },
        { name: 'Image URL', value: imageUrl, inline: true },
      )
      .setImage(interaction.message.embeds[0].image.url);

    // Fetching the message to edit it
    interaction.channel.messages.fetch(interaction.message.id).then(async () => {
      // Checking for the interaction name and sending the appropriate response
      switch (interaction.customId) {
        case ('acceptSuggestionAction'):
          await request.query(
            `UPDATE actionimages SET url=? WHERE messageId=?`,
            [interaction.message.embeds[0].image.url, interaction.message.id]
          );

          suggestionEmbed.addFields(
            { name: 'Status', value: 'Accepted' }
          );
          suggestionEmbed.setColor('Green');

          response = `The image you suggested the (${createdAt}) has been denied. Thank you for your contribution!`;
          break;
        case ('denySuggestionAction'):
          suggestionEmbed.addFields(
            { name: 'Status', value: 'Denied' },
          );
          suggestionEmbed.setColor('Red');

          response = `The image (${actionImageData.id}) you suggested has been denied.`;

          request.query(
            `DELETE FROM actionimages WHERE messageId=?`,
            [interaction.message.id]
          );
          break;
      };

      bot.users.cache.get(actionImageData.userId).send({
        content: response,
      });

      await interaction.update({
        embeds: [suggestionEmbed],
        components: []
      });

    })
  }

  //
  // Generating ticket button.
  async function ticketButton() {
    const loggingFind = await request.query(
      `SELECT * FROM loggings WHERE guildId=?`,
      [interaction.guild.id]
    )

    if (loggingFind[0][0] == undefined) return db.releaseConnection(request);;

    let reason;

    switch (interaction.customId) {
      case 'age-verification':
        reason = 'Age Verification';
        break;
      case 'report':
        reason = 'Report';
        break;
      case 'partnership':
        reason = 'Partnership';
        break;
      case 'support':
        reason = 'Support';
        break;
      default:
        reason = 'Other';
        break;
    }

    const ticketFind = await request.query(
      `SELECT * FROM ticket WHERE guildId=? AND userId=? AND reason=?`,
      [interaction.guild.id, interaction.user.id, reason]
    )

    if (ticketFind[0][0] != undefined) {
      interaction.reply({
        content: `You already created a ticket for the following reason: \`${reason}\``,
        ephemeral: true,
      });

      return db.releaseConnection(request);;
    };

    interaction.reply({
      content: "You successfully created a ticket. A staff member will accept it shortly.",
      ephemeral: true
    });

    const ticketCountFind = await request.query(
      `SELECT * FROM ticket_count WHERE guildId=?`,
      [interaction.guild.id]
    )

    let ticketCount = 1;

    if (ticketCountFind[0][0] == undefined) {
      await request.query(
        `INSERT INTO ticket_count (guildId, count) VALUES(?, ?)`,
        [interaction.guild.id, ticketCount]
      )
    } else {
      ticketCount = ticketCountFind[0][0]['count'] + 1;

      await request.query(
        `UPDATE ticket_count SET count=? WHERE guildId=?`,
        [ticketCount, interaction.guild.id]
      )
    }

    // Creating the buttons
    const newTicketButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Accept')
          .setCustomId('ticket_accept')
          .setStyle(ButtonStyle.Success),
      )
      .addComponents(
        new ButtonBuilder()
          .setLabel('Decline')
          .setCustomId('ticket_decline')
          .setStyle(ButtonStyle.Danger),
      )

    // Creating the embed
    const newTicketEmbed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketCount}`)
      .addFields(
        {
          name: 'Member',
          value: interaction.user.toString(),
          inline: true
        },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        {
          name: 'Reason',
          value: reason,
          inline: true
        },
        {
          name: 'Status',
          value: 'Waiting',
          inline: true
        },
        { name: '\u200b', value: '\u200b', inline: true },
      )
      .setColor('Yellow')

    // Sending the embed and button to the right channel
    const ticketLogChannel = interaction.guild.channels.cache.get(loggingFind[0][0]['ticket_channelDestination']);
    ticketLogChannel.send({
      embeds: [newTicketEmbed],
      components: [newTicketButton]
    }).then(async (msg) => {
      await request.query(
        `INSERT INTO ticket (guildId, userId, ticketId, reason, messageId) VALUES (?, ?, ?, ?, ?)`,
        [interaction.guild.id, interaction.user.id, ticketCount, reason, msg.id]
      )
    })
  }

  //
  // Function to edit the -> Ticket Database and Ticket Message
  async function editMessageTicket(ticket, status, color, replyStaff) {
    const loggingFind = await request.query(
      `SELECT * FROM loggings WHERE guildId=?`,
      [interaction.guild.id]
    )

    const embed = new EmbedBuilder()
      .setTitle(`Ticket #${ticket[0][0]['ticketId']}`)
      .addFields(
        {
          name: 'Member',
          value: `<@${ticket[0][0]['userId']}>`,
          inline: true
        },
        {
          name: 'Staff',
          value: interaction.user.toString(),
          inline: true
        },
        { name: '\u200b', value: '\u200b', inline: true },
        {
          name: 'Reason',
          value: ticket[0][0]['reason'],
          inline: true
        },
        {
          name: 'Status',
          value: status,
          inline: true
        },
        { name: '\u200b', value: '\u200b', inline: true },
      )
      .setColor(color)

    await bot.channels.cache.get(loggingFind[0][0]['ticket_channelDestination']).messages.fetch(ticket[0][0]['messageId'])
      .then(async (msg) => {
        await msg.edit({
          embeds: [embed],
          components: []
        });
      })
      .catch(() => { });

    await interaction.reply({
      content: replyStaff,
      ephemeral: true
    });
  }

  const action = [
    'acceptSuggestionAction',
    'denySuggestionAction'
  ]

  const ticketCreate = [
    'age-verification',
    'report',
    'partnership',
    'support',
    'other',
  ]

  const ticket = [
    'ticket_accept',
    'ticket_decline',
  ]

  const inTicket = [
    'ticket_verify',
    'ticket_delete'
  ]

  if (action.includes(interaction.customId)) return actionButton();
  else if (ticketCreate.includes(interaction.customId)) return ticketButton();
  else if (ticket.includes(interaction.customId)) {
    //
    // Get the -> Ticket Database -> ready
    let ticketFind = await request.query(
      `SELECT * FROM ticket WHERE guildId=? AND messageId=?`,
      [interaction.guild.id, interaction.message.id]
    );

    if (ticketFind[0][0] == undefined) {
      await interaction.message.delete();

      await interaction.reply({
        content: 'No data found in the **ticket** database.',
        ephemeral: true,
      });

      return db.releaseConnection(request);
    };

    //
    // Get the -> Logging Database -> Ready
    let loggingFind = await request.query(
      `SELECT * FROM loggings WHERE guildId=?`,
      [interaction.guild.id]
    );

    switch (interaction.customId) {
      case 'ticket_accept':
        //
        // Update the -> Ticket Database & Ticket Message.
        editMessageTicket(ticketFind, 'Accepted', 'Yellow', 'You **accepted** this ticket, it is currently being created.');

        //
        // Lookup for the server settings.
        const ticketLogFind = await request.query(
          `SELECT * FROM logging_ticket WHERE guildId=?`,
          [interaction.guild.id, interaction.message.id]
        )

        //
        // Check if the person clicking on the button is -> In the list.
        if (!interaction.member.roles.cache.some(role => role.id === ticketLogFind[0][0]['roleId'])) {
          await interaction.reply({
            content: 'You cannot claim ticket.',
            ephemeral: true,
          });

          break;
        }

        //
        // Check if there's a channel already in -> Ticket Database
        if (ticketFind[0][0]['channelId'] != undefined) break;

        //
        // Check if the person clicking on the button is -> Themself.
        if (ticketFind[0][0]['userId'] === interaction.user.id) {
          await interaction.reply({
            content: "You cannot claim your own ticket."
          });

          break;
        };

        //
        // Creating the ticket channel.
        const createChannel = await interaction.guild.channels.create({
          name: `${ticketFind[0][0]['reason']}-${ticketFind[0][0]['ticketId']}`,
          type: ChannelType.GuildText,
          parent: loggingFind[0][0]['ticket_categoryDestination'],
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: ticketFind[0][0]['userId'],
              type: 1,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AttachFiles],
            }
          ]
        });

        //
        // Check if the channel actually got created.
        if (!createChannel) {
          await interaction.reply({
            content: 'Failed to create a ticket channel.'
          });

          break;
        };

        //
        // Update the -> Ticket Database
        await request.query(
          `UPDATE ticket SET channelId=?, claimedBy=? WHERE messageId=?`,
          [createChannel.id, interaction.user.id, ticketFind[0][0]['userId'], interaction.message.id]
        )

        //
        // Create the embed.
        const inTicketEmbed = new EmbedBuilder()
          .setTitle(`Ticket #${ticketFind[0][0]['ticketId']}`)
          .addFields(
            {
              name: "Member",
              value: `<@${ticketFind[0][0]['userId']}>`,
              inline: true,
            },
            {
              name: "Staff",
              value: interaction.user.toString(),
              inline: true,
            },
            { name: '\u200b', value: '\u200b', inline: true },
          )
          .setColor('Blue');

        //
        // Create the button for the embed.
        const button = new ActionRowBuilder()

        //
        // Set specific fields and button for different reason.
        switch (ticketFind[0][0]['reason']) {
          case "Age Verification":
            inTicketEmbed.addFields(
              {
                name: "Requirement",
                value: "1. Be 18 years or older\n* A valid government ID or driving license"
              },
              {
                name: "Instructions",
                value: "1. Write on a piece of paper your username\n* Place your prefered governmental identification on top of the piece of paper\n* Take a picture and share it to us in this channel"
              },
            )

            button.addComponents(
              new ButtonBuilder()
                .setLabel('Verify')
                .setCustomId('ticket_verify')
                .setStyle(ButtonStyle.Success),
            )

            break;
          case "Partnership":
            inTicketEmbed.addFields(
              {
                name: "Requirement",
                value: "1. At least 250 members\n* Furry related"
              },
              {
                name: "Necessary Information",
                value: "1. A server invite code\n* The server member count\n* Is the server NSFW?"
              },
            )

            break;
          case "Report":
            inTicketEmbed.addFields(
              {
                name: "Necessary Information",
                value: "1. Offender ID\n* Offender Username\n* Reason\n* Message Forward/ID"
              },
            )

            inTicketEmbed.setColor('Red');
            break;
          default:
            inTicketEmbed.addFields(
              {
                name: "Necessary Information",
                value: "Please tell us exactly what do you need help with so we can help you quickly."
              },
            )

            break;
        }

        //
        // Create the delete button. It is at the end so it will be the last button.
        button.addComponents(
          new ButtonBuilder()
            .setLabel('Delete')
            .setCustomId('ticket_delete')
            .setStyle(ButtonStyle.Danger)
        )
        button.addComponents(
          new ButtonBuilder()
            .setLabel('Buttons → Staff Only')
            .setCustomId('ticket_warning')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        )

        //
        // Send the ticket message in the channel.
        // Pin the message afterwards.
        const channelMessage = createChannel.send({
          embeds: [inTicketEmbed],
          components: [button]
        });

        (await channelMessage).pin();

        //
        // Quickly mention the user that made the ticket.
        // Delete the message after 1 second.
        const quickMention = createChannel.send({
          content: `<@${ticketFind[0][0]['userId']}>`,
        });

        setTimeout(async () => {
          (await quickMention).delete();
        }, 1000)

        break;
      case 'ticket_decline':
        //
        // Update the -> Ticket Database & Ticket Message.
        editMessageTicket(ticketFind, 'Declined', 'Red', 'You **declined** this ticket.')

        await request.query(
          `DELETE FROM ticket WHERE messageId=?`,
          [interaction.message.id]
        )

        break;
    }
  }
  else if (inTicket.includes(interaction.customId)) {
    const ticketFind = await request.query(
      `SELECT * FROM ticket WHERE guildId=? AND channelId=?`,
      [interaction.guild.id, interaction.channel.id]
    )

    //
    // Check who is the person clicking the button
    if (ticketFind[0][0] != undefined && ticketFind[0][0]['claimedBy'] !== interaction.user.id || !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({
        content: "You cannot delete this ticket. You didn't claim it.",
        ephemeral: true,
      });

      return db.releaseConnection(request);;
    }

    switch (interaction.customId) {
      case 'ticket_delete':
        if (ticketFind[0][0] != undefined) await editMessageTicket(ticketFind, 'Completed', 'Green', 'You **completed** this ticket, it will be deleted in 3 seconds.')

        await request.query(
          `DELETE FROM ticket WHERE guildId=? AND channelId=?`,
          [interaction.guild.id, interaction.channel.id]
        )

        setTimeout(async () => {
          await interaction.channel.delete();
        }, 3000);

        break;
      case 'ticket_verify':
        //
        // Replying to the staff.
        await interaction.reply({
          content: `Currently trying to verify <@${ticketFind[0][0]['userId']}>.`,
          ephemeral: true,
        });

        //
        // Updating the profile.
        const userFind = await request.query(
          'SELECT userId FROM users WHERE userId=?',
          [interaction.targetId]
        )

        if (userFind[0][0] == undefined) {
          await request.query(
            'INSERT INTO users (userId, ageVerified) VALUES (?, ?)',
            [ticketFind[0][0]['userId'], 1]
          )
        } else {
          await request.query(
            'UPDATE users SET ageVerified=? WHERE userId=?',
            [1, ticketFind[0][0]['userId']]
          )
        }

        //
        // Sending message in channel.
        const verifiedEmbed = new EmbedBuilder()
          .addFields(
            {
              name: 'Auto-Role',
              value:
                'There is multiple roles you can grab, some are just for fun and some that gives you access to channels :\n' +
                '* <#1082135082246078464>\n' +
                '  * This channel will give you access to fun roles that will only be there for yourself. You do not get access to more channels with these roles\n' +
                '* <#1082135024264032297>\n' +
                '  * This channel will give you access to NSFW categories. Including yiff and nudes.'
            }
          )
          .setColor('Blue')

        const channel18 = interaction.guild.channels.cache.get('1091220263569461349')
        await channel18.send({
          content: `${ticketFind[0][0]['userId']} just got verified! Please make him feel welcomed~`,
          embeds: [verifiedEmbed],
        });

        //
        // Modifying the reply to alert the staff it is done.
        await interaction.deferReply({
          content: `You successfully verified <@${ticketFind[0][0]['userId']}>'s age.`,
          ephemeral: true,
        });

        break;
    }
  }

  return db.releaseConnection(request);;
});

//
// Login to discord and the bot.
bot.login(botPrivateInfo.token);