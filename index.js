require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});


const afkUsers = new Map(); 


const commands = [
    // Moderation
    new SlashCommandBuilder()
        .setName('wxldoban')
        .setDescription('Ban a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to ban').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Ban duration in days (0 = permanent)').setRequired(false))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false)),

    new SlashCommandBuilder()
        .setName('wxldomute')
        .setDescription('Mute a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to mute').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Mute duration in minutes (0 = permanent)').setRequired(false)),

    new SlashCommandBuilder()
        .setName('wxldounban')
        .setDescription('Unban a user')
        .addStringOption(opt => opt.setName('userid').setDescription('User ID to unban').setRequired(true)),

    new SlashCommandBuilder()
        .setName('wxldounmute')
        .setDescription('Unmute a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to unmute').setRequired(true)), 

    new SlashCommandBuilder()
       .setName('wxldokick')
       .setDescription('Kick a user')
       .addUserOption(opt => 
          opt.setName('target')
       .setDescription('User to kick')
       .setRequired(true)
    )
    .addStringOption(opt => 
        opt.setName('reason')
        .setDescription('Reason for kick')
        .setRequired(false)
    ),

    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(false)),

    new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for this channel')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Seconds to set slowmode').setRequired(true)),

    new SlashCommandBuilder()
    .setName('wxldopurge')
    .setDescription('Delete messages from a user or containing a keyword')
    .addUserOption(opt => opt.setName('target').setDescription('User to delete messages from').setRequired(false))
    .addStringOption(opt => opt.setName('keyword').setDescription('Delete messages containing this keyword').setRequired(false))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to scan (max 100)').setRequired(false)), 
    

    // Info / Fun
    new SlashCommandBuilder().setName('userinfofull').setDescription('Get detailed user info')
        .addUserOption(opt => opt.setName('target').setDescription('User to view detailed info')),

    new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
    new SlashCommandBuilder().setName('serverstats').setDescription('View detailed server stats'),
    new SlashCommandBuilder().setName('serverboosts').setDescription('View server boosts'),

    new SlashCommandBuilder().setName('clear').setDescription('Clear messages')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete').setRequired(true)),

    new SlashCommandBuilder().setName('avatar').setDescription('Get user avatar')
        .addUserOption(opt => opt.setName('target').setDescription('User to view avatar')),

    new SlashCommandBuilder().setName('avatarfull').setDescription('Get full-size avatar')
        .addUserOption(opt => opt.setName('target').setDescription('User to view full avatar')),

    new SlashCommandBuilder().setName('botinfo').setDescription('Show bot statistics and uptime'),
    new SlashCommandBuilder().setName('roleinfo').setDescription('Get info about a role')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to view').setRequired(true)),

    new SlashCommandBuilder().setName('help').setDescription('Show all commands'),

    // Utility / Fun
    new SlashCommandBuilder().setName('say').setDescription('Make the bot say something')
        .addStringOption(opt => opt.setName('text').setDescription('Text to say').setRequired(true)),

    new SlashCommandBuilder().setName('poll').setDescription('Create a poll')
        .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true)),

    new SlashCommandBuilder().setName('uptime').setDescription('Show bot uptime'),
    
    new SlashCommandBuilder().setName('afk').setDescription('Set your AFK status')
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for going AFK').setRequired(false))
];


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('Registering commands...');
        const commandData = commands.map(cmd => cmd.toJSON());
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandData }
        );
        console.log('Commands registered!');
    } catch (err) {
        console.error(err);
    }
})();


const sendEmbed = (interaction, title, description, options = {}, thumbnail) => {
    if (typeof options === 'string') options = { color: options };
    if (thumbnail && !options.thumbnail) options.thumbnail = thumbnail;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(options.color || '#00ccff')
        .setTimestamp()
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.fields) embed.addFields(options.fields);

    return interaction.reply({ embeds: [embed], ephemeral: options.ephemeral || false });
};


client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    
    client.user.setActivity('/help', { type: 0 }); 
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

  
if (commandName === 'wxldoban') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
        return sendEmbed(interaction, '❌ Permission Denied', 'You do not have permission to ban members.', '#ff0000');
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers))
        return sendEmbed(interaction, '❌ Bot Permission Missing', 'I do not have permission to ban members.', '#ff0000');

    const user = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration') || 0;
    const reason = interaction.options.getString('reason') || (duration > 0 ? `Temporary ban for ${duration} day(s)` : 'Permanent ban');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return sendEmbed(interaction, '❌ User Not Found', 'The specified user does not exist in this server.', '#ff0000');
    if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id)
        return sendEmbed(interaction, '❌ Cannot Ban', 'You cannot ban this user because their role is higher or equal to yours.', '#ff0000');
    if (interaction.guild.members.me.roles.highest.position <= member.roles.highest.position)
        return sendEmbed(interaction, '❌ Cannot Ban', 'I cannot ban this user because their role is higher or equal to my role.', '#ff0000');

    try {
        await member.ban({ reason });
        if (duration > 0) {
setTimeout(async () => {
    try {
        const ban = await interaction.guild.bans.fetch(user.id).catch(() => null);

        if (!ban) {
            console.log(`⚠️ User ${user.id} already unbanned or not banned.`);
            return;
        }

        await interaction.guild.members.unban(user.id);
        console.log(`✅ Auto-unbanned ${user.id}`);

    } catch (err) {
        console.error('Auto-unban error:', err);
    }
}, duration * 24 * 60 * 60 * 1000);
        }
        return sendEmbed(interaction, '✅ User Banned', duration > 0 ? `Banned **${user.id}** for **${duration} day(s)**.\nReason: ${reason}` : `Permanently banned **${user.id}**.\nReason: ${reason}`, '#00ff00', user.displayAvatarURL({ dynamic: true, size: 512 }));
    } catch(err) {
        return sendEmbed(interaction, '❌ Error', `Failed to ban **${user.id}**.\n${err}`, '#ff0000');
    }
}

if (commandName === 'wxldokick') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
        return sendEmbed(interaction, '❌ Permission Denied', 'You do not have permission to kick members.', '#ff0000');

    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) 
        return sendEmbed(interaction, '❌ User Not Found', 'The specified user does not exist in this server.', '#ff0000');

    if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id)
        return sendEmbed(interaction, '❌ Cannot Kick', 'You cannot kick this user because their role is higher or equal to yours.', '#ff0000');

    if (interaction.guild.members.me.roles.highest.position <= member.roles.highest.position)
        return sendEmbed(interaction, '❌ Cannot Kick', 'I cannot kick this user because their role is higher or equal to my role.', '#ff0000');

try {
    await member.kick(reason);

    const embed = new EmbedBuilder()
        .setTitle('User Kicked')
        .setColor('#ff4d4d')
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: '👤 User', value: `${user.tag}\n<@${user.id}>`, inline: true },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: '📄 Reason', value: reason || 'No reason provided', inline: false }
        )
        .setTimestamp()
        .setFooter({ 
            text: `User ID: ${user.id}`, 
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
        });

    return interaction.reply({ embeds: [embed] });

} catch(err) {
    return sendEmbed(interaction, '❌ Error', `Failed to kick **${user.tag}**.\n${err}`, '#ff0000');
 }
}
if (commandName === 'wxldomute') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
        return sendEmbed(interaction, '❌ Permission Denied', 'You do not have permission to mute members.', '#ff0000');

    const user = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration') || 0;
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return sendEmbed(interaction, '❌ User Not Found', 'The specified user does not exist in this server.', '#ff0000');
    if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id)
        return sendEmbed(interaction, '❌ Cannot Mute', 'You cannot mute this user because their role is higher or equal to yours.', '#ff0000');

    try {
        await member.timeout(duration > 0 ? duration * 60 * 1000 : null);
        return sendEmbed(interaction, '🔇 User Muted', duration > 0 ? `Muted **${user.tag}** for **${duration} minutes**.` : `Muted **${user.tag}** permanently.`, '#ff9900', user.displayAvatarURL({ dynamic: true }));
    } catch(err) {
        return sendEmbed(interaction, '❌ Error', `Failed to mute **${user.tag}**.\n${err}`, '#ff0000');
    }
}

if (commandName === 'wxldounmute') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
        return sendEmbed(interaction, '❌ Permission Denied', 'You do not have permission to unmute members.', '#ff0000');

    const user = interaction.options.getUser('target');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return sendEmbed(interaction, '❌ User Not Found', 'The specified user does not exist in this server.', '#ff0000');

    try {
        await member.timeout(null);
        return sendEmbed(interaction, '🔊 User Unmuted', `Successfully unmuted **${user.tag}**.`, '#00ff00', user.displayAvatarURL({ dynamic: true }));
    } catch(err) {
        return sendEmbed(interaction, '❌ Error', `Failed to unmute **${user.tag}**.\n${err}`, '#ff0000');
    }
}

if (commandName === 'wxldounban') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return sendEmbed(interaction, '❌ Permission Denied', 'You do not have permission to unban members.', '#ff0000');
    }

    const userId = interaction.options.getString('userid');

    try {
        const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);

        if (!banInfo) {
            return sendEmbed(interaction, '⚠️ Not Banned', `User ID: ${userId} is not banned.`, '#ffaa00');
        }

        try {
            await interaction.guild.members.unban(userId);
        } catch (err) {
            if (err.code === 10026) {
                return sendEmbed(interaction, '⚠️ Not Banned', `User ID: ${userId} is not banned.`, '#ffaa00');
            } else {
                throw err; 
            }
        }

        return sendEmbed(interaction, '✅ User Unbanned', `Successfully unbanned user ID: ${userId}.`, '#00ff00');

    } catch (err) {
        console.error(`❌ Failed to unban user ${userId}:`, err);

        if (!interaction.replied) {
            return sendEmbed(interaction, '❌ Error', `Failed to unban user ID: ${userId}.\n${err.message}`, '#ff0000');
        } else {
            return interaction.followUp({ content: `❌ Error: Failed to unban user ID: ${userId}.`, ephemeral: true });
        }
    }
}

  

    if (commandName === 'userinfofull') {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        const status = member.presence?.status || 'Offline';

        const embed = new EmbedBuilder()
            .setTitle(`👤 Detailed Info: ${user.tag}`)
            .setColor('#00ccff')
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Bot?', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:F>`, inline: true },
                { name: 'Joined Discord', value: `<t:${Math.floor(user.createdTimestamp/1000)}:F>`, inline: true },
                { name: 'Status', value: status, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'ping') return sendEmbed(interaction, '🏓 Pong!', `Latency: ${client.ws.ping}ms`, '#00ccff', client.user.displayAvatarURL({ dynamic: true }));


    if (commandName === 'serverstats') {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
            .setTitle(`📊 Server Stats: ${guild.name}`)
            .setColor('#00ff99')
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Server ID: ${guild.id}` });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'serverboosts') {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
            .setTitle(`⚡ Server Boosts: ${guild.name}`)
            .setColor('#ffcc00')
            .addFields(
                { name: 'Total Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true },
                { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true }
            )
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Server ID: ${guild.id}` });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'clear') {
        const amount = interaction.options.getInteger('amount');
        await interaction.channel.bulkDelete(amount, true);
        return sendEmbed(interaction, '🧹 Messages Cleared', `Deleted ${amount} messages.`, '#00ff00');
    }

    if (commandName === 'avatar') {
        const user = interaction.options.getUser('target') || interaction.user;
        return sendEmbed(interaction, `🖼️ Avatar: ${user.tag}`, `[Click here for full size avatar](${user.displayAvatarURL({ dynamic: true, size: 512 })})`, '#00ccff', user.displayAvatarURL({ dynamic: true, size: 512 }));
    }

    if (commandName === 'avatarfull') {
        const user = interaction.options.getUser('target') || interaction.user;
        const embed = new EmbedBuilder()
            .setTitle(`🖼️ Avatar: ${user.tag}`)
            .setColor('#00ccff')
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`[Click here to download avatar](${user.displayAvatarURL({ dynamic: true, size: 1024 })})`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'botinfo') {
        const uptime = Math.floor(client.uptime / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const embed = new EmbedBuilder()
            .setTitle(`🤖 Bot Info: ${client.user.username}`)
            .setColor('#ff9900')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
                { name: 'Uptime', value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Bot ID: ${client.user.id}` });
        return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'roleinfo') {
        const role = interaction.options.getRole('role');
        const embed = new EmbedBuilder()
            .setTitle(`📌 Role Info: ${role.name}`)
            .setColor(role.color || '#00ccff')
            .addFields(
                { name: 'ID', value: role.id, inline: true },
                { name: 'Color', value: `#${role.color.toString(16).padStart(6,'0')}`, inline: true },
                { name: 'Members', value: `${role.members.size}`, inline: true },
                { name: 'Mentionable?', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Hoisted?', value: role.hoist ? 'Yes' : 'No', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });
        return interaction.reply({ embeds: [embed] });
    }

if (commandName === 'slowmode') {
    const seconds = interaction.options.getInteger('seconds');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return sendEmbed(interaction, '❌ Permission Denied', 'You need Manage Channels permission.', { color: '#ff0000' });
    }

    await interaction.channel.setRateLimitPerUser(seconds);

    return sendEmbed(
        interaction,
        '⏱️ Slowmode Updated',
        `Slowmode is now set to **${seconds} seconds**.`,
        { color: '#00ff00' }
    );
}

if (commandName === 'wxldopurge') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({ content: '❌ You need Manage Messages permission.' });
    }

    const targetUser = interaction.options.getUser('target');
    const keyword = interaction.options.getString('keyword');
    const amount = interaction.options.getInteger('amount') || 50;

    try {
        const messages = await interaction.channel.messages.fetch({ limit: amount });

        const filtered = messages.filter(msg => {
            if (targetUser && msg.author.id !== targetUser.id) return false;
            if (keyword && !msg.content.toLowerCase().includes(keyword.toLowerCase())) return false;
            return true;
        });

        const deleted = await interaction.channel.bulkDelete(filtered, true);

        const embed = new EmbedBuilder()
            .setTitle('🧹 Purge Completed')
            .setDescription(`Deleted **${deleted.size}** message(s)` +
                `${targetUser ? `\n👤 User: ${targetUser.tag}` : ''}` +
                `${keyword ? `\n🔍 Keyword: "${keyword}"` : ''}`
            )
            .setColor('#00ff00')
            .setTimestamp()
            .setFooter({ text: `Purged by ${interaction.user.tag}` });

   
        await interaction.reply({ embeds: [embed] });

    } catch (err) {
        console.error(err);

      
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Failed to purge messages (14 days limit).' });
        }
    }
}

if (commandName === 'warn') {
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return sendEmbed(interaction, '❌ Permission Denied', 'You cannot warn members.', { color: '#ff0000' });
    }

   
    const embed = new EmbedBuilder()
        .setTitle('⚠️ User Warned')
        .setColor('#ff9900')
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: '👤 User', value: `${user.tag}\n<@${user.id}>`, inline: true },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: '📄 Reason', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({
            text: `User ID: ${user.id}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

    await interaction.reply({ embeds: [embed] });

 
    const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ You Have Been Warned')
        .setColor('#ff9900')
        .setDescription(`You were warned in **${interaction.guild.name}**.`)
        .addFields(
            { name: '📄 Reason', value: reason, inline: false }
        )
        .setTimestamp()
        .setFooter({
            text: 'Moderation System',
            iconURL: interaction.guild.iconURL({ dynamic: true })
        });

    try {
        const dmUser = await interaction.client.users.fetch(user.id);
        await dmUser.send({ embeds: [dmEmbed] });

        console.log(`✅ DM sent to ${user.tag}`);
    } catch (err) {
        console.error(`❌ Failed to DM ${user.tag}:`, err);

      
        await interaction.followUp({
            content: `⚠️ Could not DM ${user.tag}. They might have DMs disabled.`,
            ephemeral: true
        });
    }
}

if (commandName === 'say') {
    const text = interaction.options.getString('text');

    return sendEmbed(
        interaction,
        '💬 Bot Says',
        text,
        { color: '#00ccff' }
    );
}

if (commandName === 'poll') {
  
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return sendEmbed(
            interaction,
            '❌ Permission Denied',
            'You need the Manage Messages permission to create a poll.',
            '#ff0000'
        );
    }

    const question = interaction.options.getString('question');

    const embed = new EmbedBuilder()
        .setTitle('📊 New Poll')
        .setDescription(`**${question}**`)
        .setColor('#00ccff')
        .addFields(
            { name: '👍 Yes', value: 'React with 👍 to vote YES', inline: true },
            { name: '👎 No', value: 'React with 👎 to vote NO', inline: true }
        )
        .setFooter({ text: `Poll created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

   
    await msg.react('👍');
    await msg.react('👎');
}
if (commandName === 'uptime') {
    const uptime = Math.floor(client.uptime / 1000);
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;

    return sendEmbed(
        interaction,
        '⏱️ Bot Uptime',
        `Running for **${h}h ${m}m ${s}s**`,
        { color: '#00ff99' }
    );
}

if (commandName === 'help') {
    try {
        await interaction.deferReply(); 

        const embed = new EmbedBuilder()
            .setTitle('📖 Bot Commands Help')
            .setColor('#00ccff')
            .setDescription('Here is a categorized list of available commands:')
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        const moderation = [];
        const infoFun = [];

        const moderationCommands = [
            'wxldoban', 'wxldomute', 'wxldounban', 'wxldounmute',
            'wxldokick', 'warn', 'slowmode', 'lock', 'unlock', 'clear','wxldopurge'
        ];

        commands.forEach(cmd => {
            const name = cmd.name || cmd.data?.name;
            const desc = cmd.description || cmd.data?.description || 'No description';
            if (moderationCommands.includes(name)) moderation.push(`**/${name}** — ${desc}`);
            else infoFun.push(`**/${name}** — ${desc}`);
        });

        if (moderation.length)
            embed.addFields({ name: '🛡️ Moderation Commands', value: moderation.join('\n') });
        if (infoFun.length)
            embed.addFields({ name: '🎉 Info & Fun Commands', value: infoFun.join('\n') });

        await interaction.editReply({ embeds: [embed] }); 
    } catch (err) {
        console.error('Error in /help command:', err);
    }
}
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'afk') {
        const reason = interaction.options.getString('reason') || 'AFK';
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member) return;

        const oldNickname = member.nickname || interaction.user.username;

      
        afkUsers.set(interaction.user.id, { reason, oldNickname, time: Date.now() });

      
        if (member.manageable) {
            try {
                await member.setNickname(`AFK | ${oldNickname}`);
            } catch (err) {
                console.warn(`Cannot set AFK nickname: ${err.message}`);
            }
        }

       
        const privateEmbed = new EmbedBuilder()
            .setTitle('🌙 AFK Activated')
            .setDescription(`You are now AFK.\nReason: ${reason}`)
            .setColor('#ffaa00')
            .setTimestamp()
            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.reply({ embeds: [privateEmbed], ephemeral: true });

       
        const publicEmbed = new EmbedBuilder()
            .setTitle('🌙 User AFK')
            .setDescription(`${interaction.user.tag} is now AFK.\nReason: ${reason}`)
            .setColor('#ffaa00')
            .setTimestamp();

        await interaction.channel.send({ embeds: [publicEmbed] });
    }
});


client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const member = message.guild.members.cache.get(message.author.id);
    if (!member) return;

   
    if (afkUsers.has(message.author.id)) {
        const data = afkUsers.get(message.author.id);
        afkUsers.delete(message.author.id);

        if (member.manageable) {
            try {
                await member.setNickname(data.oldNickname);
            } catch (err) {
                console.warn(`Cannot revert nickname: ${err.message}`);
            }
        }

        const backEmbed = new EmbedBuilder()
            .setTitle('👋 Welcome Back!')
            .setDescription('Your AFK has been removed.')
            .setColor('#00ff00')
            .setTimestamp();

        message.channel.send({ embeds: [backEmbed] });
    }

 
    message.mentions.users.forEach(user => {
        if (afkUsers.has(user.id)) {
            const data = afkUsers.get(user.id);
            const mentionEmbed = new EmbedBuilder()
                .setTitle('🌙 User AFK')
                .setDescription(`${user.tag} is currently AFK.\nReason: ${data.reason}`)
                .setColor('#ffaa00')
                .setTimestamp();

            message.channel.send({ embeds: [mentionEmbed] });
        }
    });


const bannedWords = ['nigger','nigga','negro','negra'];

if (bannedWords.some(word => message.content.toLowerCase().includes(word))) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member) return;

    const botMember = message.guild.members.me;

   
    if (!botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    const isHigher = member.roles.highest.position >= botMember.roles.highest.position;

    try {
        await message.delete();

       
        if (isHigher || member.id === message.guild.ownerId) {

            
            const warnEmbed = new EmbedBuilder()
                .setTitle('⚠️ Warning Issued')
                .setColor('#ffaa00')
                .setDescription(`${member.user.tag}, please avoid using prohibited words.`)
                .addFields(
                    { name: '📄 Reason', value: 'Use of prohibited word', inline: false },
                    { name: '💬 Message', value: message.content || 'No content', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'AutoMod System', iconURL: botMember.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [warnEmbed] });

           
            try {
                const dmUser = await message.client.users.fetch(member.id);
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Warning Notification')
                    .setColor('#ffaa00')
                    .setDescription(`You were warned in **${message.guild.name}**.`)
                    .addFields(
                        { name: '📄 Reason', value: 'Use of prohibited word', inline: false },
                        { name: '💬 Message', value: message.content || 'No content', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'AutoMod System', iconURL: botMember.displayAvatarURL({ dynamic: true }) });

                await dmUser.send({ embeds: [dmEmbed] });
            } catch {
                console.log(`❌ DM failed: ${member.user.tag}`);
            }

            return;
        }


        await member.timeout(60 * 60 * 1000, 'Used a prohibited word');

        const muteEmbed = new EmbedBuilder()
            .setTitle('🔇 User Muted')
            .setColor('#ff0000')
            .setDescription(`${member.user.tag} has been muted for **1 hour**.`)
            .addFields(
                { name: '📄 Reason', value: 'Use of prohibited word', inline: false },
                { name: '💬 Message', value: message.content || 'No content', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'AutoMod System', iconURL: botMember.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [muteEmbed] });

        
        try {
            const dmUser = await message.client.users.fetch(member.id);
            const dmEmbed = new EmbedBuilder()
                .setTitle('🔇 You Have Been Muted')
                .setColor('#ff0000')
                .setDescription(`You have been muted in **${message.guild.name}** for **1 hour**.`)
                .addFields(
                    { name: '📄 Reason', value: 'Use of prohibited word', inline: false },
                    { name: '💬 Message', value: message.content || 'No content', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'AutoMod System', iconURL: botMember.displayAvatarURL({ dynamic: true }) });

            await dmUser.send({ embeds: [dmEmbed] });
        } catch {
            console.log(`❌ DM failed: ${member.user.tag}`);
        }

    } catch (err) {
        console.error(err);
    }
}
});
client.login(process.env.TOKEN);