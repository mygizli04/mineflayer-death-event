import "mineflayer";

declare module "mineflayer" {
    export interface BotEvents {
        playerDeath: (data: any) => void
    }
}