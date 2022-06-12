/**
 * @name Nitro
 * @author InvokeStatic
 * @version 1.2
 * @source https://github.com/Inv0keStatic/Vroom-bypass
 * @updateUrl https://github.com/Inv0keStatic/Vroom-bypass/blob/main/Nitro.js
 */

module.exports = (() => {
    const config = {
        "info": {
            "name": "Nitro",
            "authors": [{
                "name": "Noah Alto Crow",
                "discord_id": "0",
                "github_username": "Inv0keStatic"
            }],
            "version": "1.2",
            "description": "Unlock all screensharing modes, and use cross-server emotes & gif emotes, Discord wide! (You CANNOT upload 100MB files though. :/)",
            "github": "https://github.com/Inv0keStatic/Vroom-bypass",
            "github_raw": "https://github.com/Inv0keStatic/Vroom-bypass/blob/main/Nitro.js"
        },
        "main": "Nitro.plugin.js"
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }
        getName() {
            return config.info.name;
        }
        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }
        getDescription() {
            return config.info.description;
        }
        getVersion() {
            return config.info.version;
        }
        load() {
            BdApi.showConfirmationModal("you need", {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                Patcher,
                DiscordModules,
                Settings,
                Toasts,
                PluginUtilities
            } = Api;
            return class NitroPerks extends Plugin {
                defaultSettings = {
                    "emojiSize": "48",
                    "screenSharing": true,
                    "emojiBypass": true,
					"ghostMode": true,
					"freeStickersCompat": false,
                    "clientsidePfp": false,
					"emojiBypassForValidEmoji": true,
					"PNGemote" : true,
                    "pfpUrl": "https://i.imgur.com/N6X1vzT.gif",
					"uploadEmotes": false,
                };
                settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
                originalNitroStatus = 0;
				
				async UploadEmote(url, channelIdLmao, msg, emoji, runs) {
					const Uploader = BdApi.findModuleByProps('instantBatchUpload');
					var extension = ".gif";
					if(!emoji.animated){
						extension = ".png";
					}
					if(!this.settings.PNGemote){
						extension = ".webp";
					}
					let file = await fetch(url).then(r => r.blob()).then(blobFile => new File([blobFile], "emote"))
					if(file == undefined){alert("No file!! Contact That_Undead_Legacy#1205 cause he fucked up!")}
					
					if(runs > 1){
						await Uploader.upload({
						channelId: channelIdLmao,
						file: new File([file], emoji.name),
						draftType: 0,
						message: { content: undefined, invalidEmojis: [], tts: false, channel_id: channelIdLmao },
						hasSpoiler: false,
						filename: emoji.name + extension
					});
					return
					}
					
					await Uploader.upload({
						channelId: channelIdLmao,
						file: new File([file], emoji.name),
						draftType: 0,
						message: { content: msg.content, invalidEmojis: [], tts: false, channel_id: channelIdLmao },
						hasSpoiler: false,
						filename: emoji.name + extension
					});
				}
				
				emojiBypassForValidEmoji(emoji, currentChannelId){ //Made into a function to save space and clean up
					if(this.settings.emojiBypassForValidEmoji){
						DiscordModules.UserStore.getCurrentUser().premiumType = 0
						if(!DiscordModules.EmojiInfo.isEmojiFilteredOrLocked(emoji)){
							if(this.settings.freeStickersCompat){
							DiscordModules.UserStore.getCurrentUser().premiumType = 1
						}
						if(!this.settings.freeStickersCompat){
							DiscordModules.UserStore.getCurrentUser().premiumType = 2
						}
						return true
						}
						if(this.settings.freeStickersCompat){
							DiscordModules.UserStore.getCurrentUser().premiumType = 1
						}
						if(!this.settings.freeStickersCompat){
							DiscordModules.UserStore.getCurrentUser().premiumType = 2
						}
						if((DiscordModules.SelectedGuildStore.getLastSelectedGuildId() == emoji.guildId) && !emoji.animated && ((DiscordModules.ChannelStore.getChannel(currentChannelId).type <= 0) == true)){
							return true
						}
					}
				}
				
				
                saveAndUpdate() {
                    PluginUtilities.saveSettings(this.getName(), this.settings)
                    if (this.settings.emojiBypass) {
						if(this.settings.uploadEmotes){
								BdApi.Patcher.unpatchAll("NitroPerks",DiscordModules.MessageActions)
								BdApi.Patcher.instead("NitroPerks",DiscordModules.MessageActions, "sendMessage", (_, [, msg], send) => {
								var currentChannelId = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId()
								var runs = 0;
								msg.validNonShortcutEmojis.forEach(emoji => {
								if (emoji.url.startsWith("/assets/")) return;
								if (this.settings.PNGemote){
										emoji.url = emoji.url.replace('.webp', '.png');
								}
								if(this.emojiBypassForValidEmoji(emoji, currentChannelId)){return}
								runs++;
								emoji.url = emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize}`
								msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, "");
								this.UploadEmote(emoji.url, currentChannelId, msg, emoji, runs);
								});
								if((msg.content != undefined || msg.content != "") && runs == 0){
									send(currentChannelId, msg);
									return
								}
							return	
							});
							}
						if(this.settings.ghostMode && !this.settings.uploadEmotes) { //If Ghost Mode is enabled do this shit
							BdApi.Patcher.unpatchAll("NitroPerks",DiscordModules.MessageActions)
							Patcher.unpatchAll(DiscordModules.MessageActions)
							//console.log("Ghost Mode enabled.")
							Patcher.before(DiscordModules.MessageActions, "sendMessage", (_, [, msg]) => {
							var currentChannelId = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId()
                            msg.validNonShortcutEmojis.forEach(emoji => {
							if (this.settings.PNGemote){
								emoji.url = emoji.url.replace('.webp', '.png')
								}
							if (emoji.url.startsWith("/assets/")) return;
							if(this.emojiBypassForValidEmoji(emoji, currentChannelId)){return}
								//if no ghost mode required
								if (msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, "") == ""){
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `)
									return;
								}
								let ghostmodetext = "||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|| _ _ _ _ _ "
								if (msg.content.includes(ghostmodetext)){
									if(msg.content.includes(("https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0]))){//Duplicate emoji handling (second duplicate)
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://test.rauf.workers.dev/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
									return
									}
									if(msg.content.includes(emoji.url.split("?")[0])){ //Duplicate emoji handling (first duplicate)
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
									return
									}
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `//, console.log(msg.content), console.log("Multiple emojis")
									return
								}
								msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += ghostmodetext + "\n" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `//, console.log(msg.content), console.log("First emoji code ran")
								return
							})
						});
						}
						else
						if(!this.settings.ghostMode && !this.settings.uploadEmotes) { //If ghost mode is disabled do shitty original method
						BdApi.Patcher.unpatchAll("NitroPerks",DiscordModules.MessageActions)
						Patcher.unpatchAll(DiscordModules.MessageActions)
						//console.log("Classic Method (No Ghost)")
                        Patcher.before(DiscordModules.MessageActions, "sendMessage", (_, [, msg]) => {
							var currentChannelId = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId()
                            msg.validNonShortcutEmojis.forEach(emoji => {
								if (this.settings.PNGemote){
								emoji.url = emoji.url.replace('.webp', '.png')
								}
								if (emoji.url.startsWith("/assets/")) return;
								if(this.emojiBypassForValidEmoji(emoji, currentChannelId)){return}
								if(msg.content.includes(("https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0]))){//Duplicate emoji handling (second duplicate)
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://test.rauf.workers.dev/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
									return
								}
								if(msg.content.includes(emoji.url.split("?")[0])){ //Duplicate emoji handling (first duplicate)
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
									return
								}
                                msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `)//, console.log(msg.content), console.log("no ghost")
                            })
                        });
                        //for editing message also
                        Patcher.before(DiscordModules.MessageActions, "editMessage", (_,obj) => {
                            let msg = obj[2].content
                            if (msg.search(/\d{18}/g) == -1) return;
							if (msg.includes(":ENC:")) return; //Fix jank with editing SimpleDiscordCrypt encrypted messages.
                            msg.match(/<a:.+?:\d{18}>|<:.+?:\d{18}>/g).forEach(idfkAnymore=>{
                                obj[2].content = obj[2].content.replace(idfkAnymore, `https://cdn.discordapp.com/emojis/${idfkAnymore.match(/\d{18}/g)[0]}?size=${this.settings.emojiSize}`)
                            })
                        });
                    }
					}
                    if(!this.settings.emojiBypass) Patcher.unpatchAll(DiscordModules.MessageActions)
					if(!this.settings.uploadEmotes) BdApi.Patcher.unpatchAll("NitroPerks",DiscordModules.MessageActions)
				
					if(this.settings.freeStickersCompat){
					DiscordModules.UserStore.getCurrentUser().premiumType = 1; //new DiscordModules call
					}
					if(!this.settings.freeStickersCompat){
				   DiscordModules.UserStore.getCurrentUser().premiumType = 2; //new DiscordModules call
					}
				}
                onStart() {
					this.originalNitroStatus = DiscordModules.UserStore.getCurrentUser().premiumType; //new DiscordModules call
					this.saveAndUpdate()
					if(this.settings.freeStickersCompat){
					DiscordModules.UserStore.getCurrentUser().premiumType = 1 //new DiscordModules call
					}
					if(!this.settings.freeStickersCompat){
						DiscordModules.UserStore.getCurrentUser().premiumType = 2 //new DiscordModules call
					}
                }

                onStop() {
					DiscordModules.UserStore.getCurrentUser().premiumType = this.originalNitroStatus;
                    Patcher.unpatchAll();
					BdApi.Patcher.unpatchAll("NitroPerks");
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/