
export class AutoSpawn {

    static queueSpawns(room: Room) {
        //count each creep by role and store info
        if (room.memory.creepRoleCounts.tick != Game.time) {
            room.memory.creepRoleCounts.data = _.countBy(_.filter(Game.creeps, (c) => { return c.memory.spawnRoom == room.name; }), (c) => { return c.memory.role });
            room.memory.creepRoleCounts.tick = Game.time;
        }

        //failsafe to restore room, spawn a single harvester to bootstrap the base
        if (room.memory.creepRoleCounts.data.length == 0) {
            room.memory.spawnQueue.push({
                memory: <CreepMemory>{ role: 'harvester', task: null, working: false, spawnRoom: room.name },
                body: [<BodyPartConstant>WORK, <BodyPartConstant>CARRY, <BodyPartConstant>MOVE]
            });
        }
    }

}
