const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eyoh')
		.setDescription('Nice...'),
	async execute(interaction) {
        
		await interaction.reply('69');
	},
};