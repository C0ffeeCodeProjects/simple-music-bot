import { Client } from "discord.js";
import type { StreamDispatcher, VoiceChannel, VoiceConnection } from "discord.js";
import ytdl from "ytdl-core-discord";
import ytpl from "ytpl";
import { config } from "dotenv";

config();
const botKey: string = process.env.botKey;
const playlistId: string = process.env.playlistId;
const channelId: string = process.env.channelId;

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
	if (msg.content === "!skip")
	{
		console.log("skipping...");
		stream.pause();
		stream.destroy();
		onFinish();
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
	return res.items;
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
	disp = conn.play(stream, { type: "opus", volume: false });

	disp.on("finish", () => onFinish());
	disp.on("error", e => console.log("error: " + e));
	disp.on("unpipe", () => console.log("unpipe, might be because of a poor network connection"));
}
