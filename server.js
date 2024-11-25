const { Partials, Client, GatewayIntentBits, EmbedBuilder, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const { botPrivateInfo } = require('./config/main.json');

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
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});
const date = new Date();

const localDate = `${date.toLocaleString()} ->`;

let db = mysql.createPool({
  host: botPrivateInfo.database.host,
  port: botPrivateInfo.database.port,
  user: botPrivateInfo.database.username,
  password: botPrivateInfo.database.password,
  database: "cherylbo_servers",
  waitForConnections: true,
  connectionLimit: 100,
});

db.on('error', (error) => {
  console.error(`${localDate} MySQL error`, error);
})

db.on('close', (error) => {
  console.error(`${localDate} MySQL close`, error);
})

module.exports = { bot, date, localDate, db };

function loadIntCommand() {
  let commandsPath = path.join(__dirname, 'commands');
  let commandsFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandsFiles) {
    let filesPath = path.join(commandsPath, file);
    let command = require(filesPath);
    bot.commands.set(command.data.name, command);
  };

  console.log(`${localDate} All interaction loaded.`)
};

function loadEvent() {
  let eventsPath = path.join(__dirname, 'events');
  let eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (let file of eventsFiles) {
    let filesPath = path.join(eventsPath, file);
    let event = require(filesPath);
    if (event.once) {
      bot.once(event.name, (...args) => event.execute(...args));
    } else {
      bot.on(event.name, (...args) => event.execute(...args));
    }
  };

  console.log(`${localDate} All events loaded.`)
};

bot.commands = new Collection();

loadIntCommand();
loadEvent();

bot.on('interactionCreate', async (interaction) => {
  if (!interaction.guild) return;

  const request = await db.getConnection();

  function editMessageTicket(ticket, status, color) {
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

    interaction.channel.messages.fetch(interaction.message.id).then(() => {
      interaction.update({
        embeds: [embed],
        components: []
      })
    });
  }

  // Action button
  async function actionButton() {
    const actionFind = await request.query(
      `SELECT * FROM actionimages WHERE messageId=?`,
      [interaction.message.id]
    )

    if (actionFind[0][0] == undefined) return release();

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

  // Ticket button
  async function ticketButton() {
    const loggingFind = await request.query(
      `SELECT * FROM loggings WHERE guildId=?`,
      [interaction.guild.id]
    )

    if (loggingFind[0][0] == undefined) return release();

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
      `SELECT * FROM ticket WHERE guildId=? AND reason=?`,
      [interaction.guild.id, reason]
    )

    if (!ticketFind[0][0] == undefined) {
      interaction.reply({
        content: `You already created a ticket for the following reason: \`${reason}\``,
        ephemeral: true,
      });

      return release();
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

  function release() {
    db.releaseConnection(request);
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
    'ticket_accept',
    'ticket_delete'
  ]

  if (action.includes(interaction.customId)) return actionButton();
  else if (ticketCreate.includes(interaction.customId)) return ticketButton();
  else if (ticket.includes(interaction.customId)) {
    let ticketFind = await request.query(
      `SELECT * FROM ticket WHERE guildId=? AND messageId=?`,
      [interaction.guild.id, interaction.message.id]
    )

    let loggingFind = await request.query(
      `SELECT * FROM loggings WHERE guildId=?`,
      [interaction.guild.id]
    )

    // Check if there is data in the logging and ticket database
    if (ticketFind[0][0] == undefined || loggingFind[0][0] == undefined) return release();

    switch (interaction.customId) {
      case 'ticket_accept':
        const ticketLogFind = await request.query(
          `SELECT * FROM logging_ticket WHERE guildId=?`,
          [interaction.guild.id, interaction.message.id]
        )

        if (!interaction.member.roles.cache.some(role => role.id === ticketLogFind[0][0]['roleId'])) {
          interaction.reply({
            content: 'You cannot claim ticket.',
            ephemeral: true,
          });

          break;
        }

        if (ticketFind[0][0]['userId'] === interaction.user.id) {
          interaction.reply({
            content: "You cannot claim your own ticket."
          });

          break;
        }

        if (ticketFind[0][0]['channelId'] != undefined) break;

        // Creating the ticket channel
        const createChannel = await interaction.guild.channels.create({
          name: `${ticketFind[0][0]['reason']}-${ticketFind[0][0]['ticketId']}`,
          type: ChannelType.GuildText,
          parent: loggingFind[0][0]['ticket_categoryDestination'],
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: 'ViewChannel',
            },
            {
              id: interaction.user.id,
              allow: 'ViewChannel',
            },
            {
              id: ticketFind[0][0]['userId'],
              allow: 'ViewChannel',
            }
          ]
        });

        // On creation of the channel, we send a message.
        if (createChannel) {
          await request.query(
            `UPDATE ticket SET channelId=?, claimedBy=? WHERE userId=? AND guildId=?`,
            [createChannel.id, interaction.user.id, ticketFind[0][0]['userId'], interaction.guild.id]
          )

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

          const button = new ActionRowBuilder()

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

          button.addComponents(
            new ButtonBuilder()
              .setLabel('Delete')
              .setCustomId('ticket_delete')
              .setStyle(ButtonStyle.Danger),
          )

          // Send the ticket message in the channel.
          createChannel.send({
            embeds: [inTicketEmbed]
          }).then((msg) => msg.pin);

          createChannel.send({
            content: `<@${ticketFind[0][0]['userId']}>`,
          }).then((msg) => {
            setTimeout(() => {
              msg.delete();
            }, 1000)
          });
        };

        editMessageTicket(ticketFind, 'Accepted', 'Yellow');

        break;
      case 'ticket_decline':

        editMessageTicket(ticketFind, 'Declined', 'Red')

        break;
    }
  }
  else if (inTicket.includes(interaction.customId)) {
    const ticketFind = await request.query(
      `SELECT * FROM ticket WHERE guildId=? AND channelId=?`,
      [interaction.guild.id, interaction.channel.id]
    )

    // Check who is the person clicking the button
    if (ticketFind[0][0]['claimedBy'] !== interaction.user.id) {
      interaction.reply({
        content: "You cannot delete this ticket. You didn't claim it."
      });

      return release();
    }

    switch (interaction.customId) {
      case 'ticket_delete':
        setTimeout(() => {
          interaction.channel.delete(`Ticket has been completed by ${interaction.user.toString()}`)
        }, 3000);

        editMessageTicket(ticketFind, 'Completed', 'Green')

        await request.query(
          `DELETE FROM ticket WHERE guildId=? AND channelId=?`,
          [interaction.guild.id, interaction.channel.id]
        )

        break;
      case 'ticket_verify':

        break;
    }
  }

  release();
});

bot.login(botPrivateInfo.token);