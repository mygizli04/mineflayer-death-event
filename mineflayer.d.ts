import "mineflayer";

declare module "mineflayer" {
    export interface BotEvents {
        playerDeath: (data: EmitData) => void
    }
}

interface EmitData {
    victim: EntityData,
    offender: EntityData | null,
    weapon: {
        tag: string,
        assetId: string
        name: string,
        raw: () => ChatMessage
        tagToJson: () => string
    } | null;
    method: string;
}

type EntityData = MobData | PlayerData

interface MobData {
    type: "mob",
    detail: () => undefined,
    raw: () => ChatMessage
}

interface PlayerData {
    type: "player",
    id: string,
    detail: () => Player,
    raw: () => ChatMessage
}