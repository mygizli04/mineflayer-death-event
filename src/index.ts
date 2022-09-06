import get from "lodash.get";
import mojangson from "mojangson";

import { Bot } from "mineflayer";

export const DEATH_ENTITY_TYPE_MOB = 'mob'
export const DEATH_ENTITY_TYPE_PLAYER = 'player'

// Typescript safe
function hasOwnProperty<X extends {}, Y extends PropertyKey>
  (obj: X, prop: Y): obj is X & Record<Y, unknown> {
  return obj.hasOwnProperty(prop)
}

/**
 * Emit player death event.
 * @param {Object} bot Mineflayer bot instance.
 */
export default function deathEvent(bot: Bot) {

    bot.once("spawn", () => {
        bot.on("message", (jsonMsg, position) => {
            if (position !== "system") return;

            try {
                if (!hasOwnProperty(jsonMsg, "translate")) return;
                if (!hasOwnProperty(jsonMsg, "with")) return;

                // Gotta make typescript happy!
                if (typeof jsonMsg.translate !== "string") return;
                if (!Array.isArray(jsonMsg.with)) return;

                if (!jsonMsg.translate) return;
                if (!jsonMsg.translate.startsWith("death.")) return;
                const deathType = jsonMsg.translate;
                const victimPlayer = jsonMsg.with[0];

                let weapon = null;
                if (deathType.endsWith(".item")) {
                    const weaponData = jsonMsg.with.find((item) => item.translate === "chat.square_brackets");
                    const weaponContents = weaponData.hoverEvent.contents;
                    const weaponTag = mojangson.parse(weaponContents.tag);
                    weapon = {
                        tag: weaponContents.tag,
                        assetId: weaponContents.id,
                        mame: get(weaponTag, "value.display.value.Name.value.text.value", null),
                    };
                    defineProperty(weapon, "raw", weaponData.json)
                    defineProperty(weapon, "tagToJSON", function () {
                        return mojangson.simplify(weaponTag);
                    })
                }

                let offender = null;
                if (jsonMsg.with.length >= 2) {
                    const offenderPlayerOrMob = jsonMsg.with[1];
                    const isMob = get(offenderPlayerOrMob, "hoverEvent.contents.name.translate", "").startsWith("entity.");
                    offender = {
                        id: isMob ? get(offenderPlayerOrMob, "hoverEvent.contents.type") : get(offenderPlayerOrMob, "hoverEvent.contents.id"),
                        type: isMob ? DEATH_ENTITY_TYPE_MOB : DEATH_ENTITY_TYPE_PLAYER,
                    };
                    defineProperty(offender, "raw", offenderPlayerOrMob)
                    defineProperty(offender, "detail", getPlayerByUUID.bind(null, bot, offender.id))
                }

                const emitData = {
                    victim: { id: get(victimPlayer, "hoverEvent.contents.id") },
                    offender,
                    weapon,
                    method: deathType,
                };

                defineProperty(emitData.victim, "raw", victimPlayer.json)
                defineProperty(emitData.victim, "detail", getPlayerByUUID.bind(null, bot, emitData.victim.id))
                defineProperty(emitData, "raw", jsonMsg.json)

                bot.emit("playerDeath", emitData);
            } catch (error) {
                console.error(error);
            }
        });
    });
}

function defineProperty(target: any, key: PropertyKey, value: any) {
    Object.defineProperty(target, key, { value, writable: false, enumerable: false, configurable: false });
}

function getPlayerByUUID(bot: Bot, playerUUID: string) {
    if (playerUUID.includes(":")) return playerUUID // coz when uuid contains ":" it is a entity.
    return Object.values(bot.players).find((player) => player.uuid === playerUUID);
}