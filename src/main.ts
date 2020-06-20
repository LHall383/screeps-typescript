import { AutoSpawn } from "autospawn/auto_spawn";
import "creep-tasks/prototypes";
import { Tasks } from "creep-tasks/Tasks";
import { RoleHarvester } from "roles/harvester";
import { ErrorMapper } from "utils/ErrorMapper";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    console.log(`Current game tick is ${Game.time}`);

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }

    // Look through all rooms with a spawn and queue spawns, then perform spawns
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            AutoSpawn.queueSpawns(room);
            AutoSpawn.spawnFromQueue(room);
        }
    }

    // Search through all the creeps in the game, and perform actions
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        if (creep.isIdle && creep.memory.role === RoleHarvester.roleName) {
            console.log(creep.name + " finding new task");
            RoleHarvester.newTask(creep);
        } else if (creep.isIdle) {
            if (creep.carry.energy < creep.carryCapacity) {
                const sources = creep.room.find(FIND_SOURCES);
                creep.task = Tasks.harvest(sources[0]);
            } else {
                const dest = Game.spawns["Spawn1"];
                creep.task = Tasks.transfer(dest);
            }
        }

        creep.run();
    }
});
