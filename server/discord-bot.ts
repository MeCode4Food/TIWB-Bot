import Discord, { TextChannel } from "discord.js";
import { Message } from "discord.js";
import Command from "./commands/_command";
import chalk from "chalk";
import SIGNALE from "signale";
import * as _ from "lodash";
import fs from "fs";

export class DiscordBot {
    private client = new Discord.Client();
    private commands = new Discord.Collection();
    private token = "";
    private commandList = [];
    private readonly prefix = process.env.COMMAND_PREFIX;

    constructor() {
        try {
            this.initListeners();
            this.initENV();
            this.initCommands();
        } catch (error) {
            SIGNALE.error(error);
        }
    }

    public start(token: string): void {
        this.token = token;
        this.client.login(token);
    }

    private initListeners(): void {
        this.client.on("ready", () => {
            SIGNALE.success(chalk.green("Logged in!"));
            this.client.user.setActivity("Artifact Waiting Room");
        });

        this.client.on("message", (message: Message) => {
            // Log messages
            console.log(chalk.green(message.author.username) + ":"
             + chalk.cyan((message.channel as TextChannel).name) + ">" + chalk.blue(message.toString()));

            if (message.content.startsWith(this.prefix!)) {

                const args: string[] = message.content.slice(this.prefix!.length).split(/ +/);
                const commandName: string = args.shift()!.toLowerCase().replace(this.prefix!, "");

                if (commandName === "debug") {
                    console.log("list");
                    // console.log(message.guild.emojis);
                }

                // check if collects has the command, if yes, execute it
                if (this.commands.has(commandName)) {
                    try {
                        // ignore errors here by using cast 'as any'.
                        (this.commands.get(commandName)! as any).execute(this as DiscordBot, message, args);
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        });

        this.client.on("error", (error) => {
            SIGNALE.error(error.message);
            if (error.message === "read ECONNRESET") {
                this.start(this.token);
            }
        });
    }

    // doesn't really initialize environmental variables
    private initENV(): void {
        if (_.isEmpty(this.prefix)) {
            throw new Error(`Please make sure .env is complete Prefix: ${this.prefix}`);
        }
    }

    private initCommands(): void {
        // read all folders inside ./server/commands
        const directory = "./server/commands";

        this.loadCommandsFromDirectory(directory);
    }

    private loadCommandsFromDirectory(directory: string) {
        const commandFiles: string[] = fs.readdirSync(directory);

        // loop through all of them and add them to this.commands as part of a collection
        for (const file of commandFiles) {
            if (!file.startsWith("_")) {
                const commandClass: any = require(`./commands/${file}`).default;
                const command: any = new commandClass();

                /*ts-lint:disable */
                this.commands.set(command.name, command);
            }
        }
        // console.log("commands", this.commands.entries());
    }
}
