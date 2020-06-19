
export class AutoSpawn {
    static CONSONANTS = <string>"bcdfghjklmnpqrstvwxz"

    static VOWELS = <string>"aeiouy"

    //Pick a random name
    static generateName() {
        let name = "";
        for (let i = 0; i < 5; i++) {
            if (i % 2 == 0) {
                let letter = this.CONSONANTS[Math.floor(Math.random() * this.CONSONANTS.length)];
                if (i == 0) {
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

    static addToSpawnQueue(room: Room, creepSpawnRequest: any) {
        const roles = _.map(room.memory.spawnQueue, i => i.memory.role);
        if (_.contains(roles, creepSpawnRequest.memory.role) == false) {
            room.memory.spawnQueue.push(creepSpawnRequest);
            console.log("Adding to spawn queue: " + JSON.stringify(creepSpawnRequest));
        }
    }

    static queueSpawns(room: Room) {
        room.memory.creepRoleCounts = room.memory.creepRoleCounts || { tick: 0, data: {} };
        room.memory.spawnQueue = room.memory.spawnQueue || [];

        //count each creep by role and store info
        if (room.memory.creepRoleCounts.tick != Game.time) {
            room.memory.creepRoleCounts.data = _.countBy(_.filter(Game.creeps, (c) => { return c.memory.spawnRoom == room.name; }), (c) => { return c.memory.role });
            room.memory.creepRoleCounts.tick = Game.time;
        }

        //failsafe to restore room, spawn a single harvester to bootstrap the base
        if (Object.keys(room.memory.creepRoleCounts.data).length == 0) {
            const creepSpawnRequest = {
                memory: <CreepMemory>{ role: 'harvester', task: null, working: false, spawnRoom: room.name },
                body: [<BodyPartConstant>WORK, <BodyPartConstant>CARRY, <BodyPartConstant>MOVE]
            }
            this.addToSpawnQueue(room, creepSpawnRequest);
        }
    }

    static spawnFromQueue(room: Room) {
        room.memory.spawnQueue = room.memory.spawnQueue || [];

        //if spawn queue is empty, exit early
        if (room.memory.spawnQueue.length == 0) {
            return;
        }

        //get all non-busy spawns in the room
        let freeSpawns = room.find(FIND_MY_SPAWNS, { filter: spawn => spawn.spawning == null });

        //if no spawns are available, exit early
        if (freeSpawns.length == 0) {
            return;
        }

        //spawn the first request on the queue
        let creepToSpawn = room.memory.spawnQueue.shift();
        if (creepToSpawn) {
            freeSpawns[0].spawnCreep(creepToSpawn.body, this.generateName(), { memory: creepToSpawn.memory });
        }
    }

}
