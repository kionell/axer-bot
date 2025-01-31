import { PrivateMessage } from "bancho.js";
import getOrCreateBanchoUser from "../../../database/utils/getOrCreateBanchoUser";
import { sendBeatmapCalculation } from "../helpers/sendBeatmapCalculation";
import { AxerBancho } from "../client";

export default {
    settings: {
        name: "with",
        description: "Calculate the latest /np beatmap pp with given mods (!with <mods>)",
    },
    run: async function (pm: PrivateMessage, bancho: AxerBancho, args: string[]) {
        const userApi = await pm.user.fetchFromAPI();

        if (!userApi) return pm.user.sendMessage("Can't fetch api user");

        const user = await getOrCreateBanchoUser(userApi.id);

        if (!user) return pm.user.sendMessage("User not found! Try again.");

        if (!user.last_beatmap) return pm.user.sendMessage("Use /np before use this command!");

        const getRate = () => {
            const slots = [args[0] || "", args[1] || ""];
            const rate = isNaN(Number(slots[0].slice(0, -1)))
                ? slots[1].slice(0, -1)
                : slots[0].slice(0, -1); // remove x after the string "1.2x" example
            const rateNumber = Number(rate);

            if (isNaN(rateNumber)) return undefined;
            if (rateNumber < 0.1 || rateNumber > 10.0) return undefined;

            return Number(rate);
        };

        sendBeatmapCalculation({
            pm,
            beatmap_id: user.last_beatmap,
            mods: args[0],
            rate: getRate(),
        });
    },
};
