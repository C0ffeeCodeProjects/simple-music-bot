import { Client } from "discord.js";
import type { StreamDispatcher, VoiceChannel, VoiceConnection } from "discord.js";
import ytdl from "ytdl-core-discord";
import ytpl from "ytpl";
import { config } from "dotenv";
import "./statuscheck";

config();
const botKey: string = process.env.botKey;
const channelId: string = process.env.channelId;
const channelTextId: string = process.env.channelTextId;
let playlistId: string = process.env.playlistId;
const volume = Number(process.env.volume ?? .25);

const client = new Client();
let channel: VoiceChannel;
let conn: VoiceConnection;
let list: ytpl.Item[];
let index = 0;
let disp: StreamDispatcher;
let stream: any;

getPlaylist()
	.then(() => joinChannel()
	.then(() => play()));

client.once("ready", () => {
	console.log("Ready!");
});

client.on("message", (msg) => {
	if (msg.channel.id !== channelTextId)
		return;
	console.log(msg.channel.id);
	console.log(channelTextId);
	if (msg.content === ".skip")
	{
		console.log("skipping...");
		stream.pause();
		stream.destroy();
		onFinish();
	}
	if (msg.content.startsWith(".play"))
	{
		playlistId = msg.content
			.replace(".play", "")
			.replace(" ", "");
		index = 0;
		getPlaylist()
			.then(() => play());
	}
	if (msg.content.toLowerCase() === ".currentsong")
	{
		msg.reply("Currently playing: " + list[index].title);
	}
});

async function joinChannel()
{
	await client.login(botKey);
	channel = await client.channels.fetch(channelId) as VoiceChannel;
	conn = await channel.join();

	conn.on("disconnect", async () => {
		await joinChannel();
		play();
	});
}

async function getPlaylist()
{
	const res = await ytpl(playlistId);
	list = res.items;
}

function onFinish()
{
	console.log("next track");
	index += 1;
	if (index >= list.length)
		index = 0;
	play();
}

async function play()
{
	console.log("now playing: " + list[index].title);
	const id = list[index].url;
	stream = await ytdl(id, { quality: "highestaudio", highWaterMark: 1 << 25 });
	disp = conn.play(stream, { type: "opus", volume: volume });

	disp.on("finish", () => onFinish());
	disp.on("error", e => console.log("error: " + e));
	disp.on("unpipe", () => console.log("unpipe, might be because of a poor network connection"));
}
