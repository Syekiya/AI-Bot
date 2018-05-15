"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hooks_1 = require("./Hooks");
const APIServer_1 = require("./APIServer");
const IRC_1 = require("./Connections/IRC");
const Discord_1 = require("./Connections/Discord");
const Ark_1 = require("./Connections/Ark");
const jsonfile = require("jsonfile");
let LastfmAPI = require('lastfmapi');
class Bot {
    constructor() {
        this._initConfig();
        this._initHooks();
        this._initAPIServer();
        this._initIRC();
        this._initDiscord();
        this._addCoreHooks();
        this.lastfm = new LastfmAPI(this.config.lastfm);
    }
    _initConfig() {
        let config = jsonfile.readFileSync(__dirname + "/config.json");
        this.config = config;
    }
    _initHooks() {
        this.hooks = new Hooks_1.Hooks();
    }
    _initAPIServer() {
        this.apiServer = new APIServer_1.APIServer(this.config.api.port, this);
    }
    _initArk() {
        this.ark = new Ark_1.Ark(this.config.ark.host, this.config.ark.port, this.config.ark.password);
    }
    _initIRC() {
        this.irc = new IRC_1.IRC(this.config.irc.host, this.config.irc.port, this.config.irc.nick, this.config.irc.ident, this.config.irc.realname);
        let irc = this.irc;
        let ark = this.ark;
    }
    _initDiscord() {
        this.discord = new Discord_1.Discord(this.config.discord.token);
    }
    _addCoreHooks() {
        let irc = this.irc;
        let ark = this.ark;
        let discord = this.discord;
        this.irc.on("motd", () => {
            let channels = this.config.irc.channels;
            channels.forEach((channel) => {
                irc.join(channel);
            });
        });
        this.discord.on('message', (msg) => {
            if (msg.channel.name == "alexa" && msg.author.username != "Alexa") {
                irc.msg("#alexa", "[DISCORD][" + msg.author.username + "] " + msg.content);
            }
        });
        this.irc.on("message", (from, to, message) => {
            if (to == "#alexa" && from != this.config.irc.nick) {
                discord.msg("alexa", "[IRC][" + from + "] " + message);
            }
        });
        this.discord.on("message", (msg) => {
            if (msg.content.startsWith("!np")) {
                let username = msg.content.split(" ")[1];
                this.lastfm.user.getRecentTracks({ "user": username, "limit": 1 }, (error, tracks) => {
                    if (tracks.track[0] !== 'undefined') {
                        let np = tracks.track[0];
                        if (np['@attr'].nowplaying == 'true') {
                            discord.msg(msg.channel.name, "[NP] " + username + " is listening to " + np.name + " by " + np.artist['#text']);
                        }
                    }
                });
            }
        });
        this.discord.on("message", (msg) => {
            if (msg.content.startsWith("!v")) {
                if (msg.member.voiceChannel) {
                    msg.member.voiceChannel.join()
                        .then((connection) => {
                        connection.playArbitraryInput("http://dora-robo.com/muzyka/70's-80's-90's%20/Rick%20Astley%20-%20Never%20Gonna%20Give%20You%20Up.mp3");
                        let reciever = connection.createReceiver();
                        reciever.on("opus", (talker, buffer) => {
                            console.log(buffer.length);
                        });
                        /*let avs =  new AVS({
                            debug: true,
                            clientId: "amzn1.application-oa2-client.647952a964fe453594ad73446d608609",
                            clientSecret: "15cba8d6ca172a5aa93517f4d7c850f8b1513f037b6efca00bf00e72aad41c0b",
                            deviceId: "TheRedQueen",
                            refreshToken: ""
                        });


                        let reciever = connection.createReceiver();
                        reciever.on("opus", (talker: discordjs.UserResolvable, buffer: discordjs.BufferResolvable) => {
                            console.log(buffer);
                        });
                        reciever.on("pcm", (talker:discordjs.UserResolvable, buffer: any) => {
                            console.log(talker);
                            avs.sendAudio(buffer)
                            .then(({xhr, response}) => {
                                var promises = [];
                                var audioMap = {};
                                var directives = null;

                                if (response.multipart.length) {
                                    console.log(response.multipart.length);
                                    response.multipart.forEach((multipart: any) => {
                                        let body = multipart.body;
                                        if (multipart.headers && multipart.headers['Content-Type'] === 'application/json') {
                                            try {
                                                body = JSON.parse(body);
                                            } catch (error) {
                                                console.error(error);
                                            }

                                            if (body && body.messageBody && body.messageBody.directives) {
                                                directives = body.messageBody.directives;
                                            }
                                        } else if (multipart.headers['Content-Type'] === 'audio/mpeg') {
                                            const start = multipart.meta.body.byteOffset.start;
                                            const end = multipart.meta.body.byteOffset.end;


                                            var slicedBody = xhr.response.slice(start, end);

                                            //promises.push(avs.player.enqueue(slicedBody));
                                            audioMap[multipart.headers['Content-ID']] = slicedBody;
                                        }
                                    });
                                }
                            });
                        });


                        avs.on(AVS.EventTypes.LOG, () => {
                            console.log(this);
                        });
                        avs.on(AVS.EventTypes.ERROR, () => {
                            console.log(this);
                        });

                        avs.player.on(AVS.Player.EventTypes.LOG, () => {
                            console.log();
                        });
                        avs.player.on(AVS.Player.EventTypes.ERROR, () => {
                            console.log();
                        });
                        */
                        //avs.login({responseType: 'code'});
                    })
                        .catch(console.log);
                }
                else {
                    msg.reply('You need to join a voice channel first!');
                }
            }
        });
        this.irc.on("message", (from, to, message) => {
            if (message.startsWith("!np")) {
                let username = message.split(" ")[1];
                this.lastfm.user.getRecentTracks({ "user": username, "limit": 1 }, (error, tracks) => {
                    if (tracks.track[0] !== 'undefined') {
                        let np = tracks.track[0];
                        if (np['@attr'].nowplaying == 'true') {
                            irc.msg(to, "[NP] " + username + " is listening to " + np.name + " by " + np.artist['#text']);
                        }
                    }
                });
            }
        });
    }
}
exports.Bot = Bot;
let bot = new Bot();
//# sourceMappingURL=Bot.js.map