export class AutoSpawn {
    public static spawnFromQueue(room: Room) {
        room.memory.spawnQueue = room.memory.spawnQueue || [];

        // if spawn queue is empty, exit early
        if (room.memory.spawnQueue.length === 0) {
            return;
        }

        // get all non-busy spawns in the room
        const freeSpawns = room.find(FIND_MY_SPAWNS, { filter: spawn => spawn.spawning == null });

        // if no spawns are available, exit early
        if (freeSpawns.length === 0) {
            return;
        }

        // spawn the first request on the queue
        const creepToSpawn = room.memory.spawnQueue.shift();
        if (creepToSpawn) {
            freeSpawns[0].spawnCreep(creepToSpawn.body, this.generateName(), { memory: creepToSpawn.memory });
        }
    }

    public static queueSpawns(room: Room) {
        room.memory.creepRoleCounts = room.memory.creepRoleCounts || { tick: 0, data: {} };
        room.memory.spawnQueue = room.memory.spawnQueue || [];

        // count each creep by role and store info
        if (room.memory.creepRoleCounts.tick !== Game.time) {
            room.memory.creepRoleCounts.data = _.countBy(
                _.filter(Game.creeps, c => {
                    return c.memory.spawnRoom === room.name;
                }),
                c => {
                    return c.memory.role;
                }
            );
            room.memory.creepRoleCounts.tick = Game.time;
        }

        // failsafe to restore room, spawn a single harvester to bootstrap the base
        if (Object.keys(room.memory.creepRoleCounts.data).length === 0) {
            const creepSpawnRequest = {
                memory: { role: "harvester", task: null, working: false, spawnRoom: room.name },
                body: [WORK, CARRY, MOVE]
            };
            this.addToSpawnQueue(room, creepSpawnRequest);
        }
    }

    private static addToSpawnQueue(room: Room, creepSpawnRequest: { memory: CreepMemory; body: BodyPartConstant[] }) {
        const roles = _.map(room.memory.spawnQueue, i => i.memory.role);
        if (_.contains(roles, creepSpawnRequest.memory.role) === false) {
            room.memory.spawnQueue.push(creepSpawnRequest);
            console.log("Adding to spawn queue: " + JSON.stringify(creepSpawnRequest));
        }
    }

    private static CONSONANTS = "bcdfghjklmnpqrstvwxz";
    private static VOWELS = "aeiouy";

    // Pick a dope name
    private static generateName() {
        let name = "";

        for (let i = 0; i < 5; i++) {
            if (i % 2 === 0) {
                const letter = this.CONSONANTS[Math.floor(Math.random() * this.CONSONANTS.length)];
                if (i === 0) {
                    name += letter.toUpperCase();
                } else {
                    name += letter;
                }
            } else {
                name += this.VOWELS[Math.floor(Math.random() * this.VOWELS.length)];
            }
        }

        return name;
    }
}
