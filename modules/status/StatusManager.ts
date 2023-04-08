import {
    APIMessage,
    EmbedBuilder,
    MessagePayload,
    User,
    WebhookClient,
    WebhookMessageCreateOptions,
} from "discord.js";
import colors from "../../constants/colors";
import { bot } from "../..";

export class StatusManager {
    private webhookURL = process.env.STATUS_WEBHOOK;
    private webhook;

    constructor() {
        if (this.webhookURL) {
            this.webhook = new WebhookClient({
                url: this.webhookURL,
            });
        }
    }

    sendOutageMessage(reason?: string, user?: User) {
        const embed = new EmbedBuilder()
            .setTitle("⚠️ AxerBot Outage")
            .setDescription(reason || "No reason provided...")
            .setColor(colors.red)
            .setFooter({
                text: "System",
            });

        if (user) {
            embed.setFooter({
                text: user.tag,
                iconURL: user.avatarURL() || "",
            });
        }

        return this.sendMessage({
            embeds: [embed],
        });
    }

    sendMessage(
        message: string | MessagePayload | WebhookMessageCreateOptions
    ): Promise<APIMessage | null> {
        return new Promise((resolve, reject) => {
            if (!this.webhook) return resolve(null);

            this.webhook
                .send(
                    typeof message == "string"
                        ? message
                        : Object.assign(
                              {
                                  username: "AxerBot Status",
                                  avatarURL: `https://a.ppy.sh/${process.env.IRC_OSU_ID}`,
                              },
                              message
                          )
                )
                .then(resolve)
                .catch(reject);
        });
    }
}
