import { AutoSpawn } from "autospawn/auto_spawn";
import "creep-tasks/prototypes";
import { RoleName } from "enums/RoleName";
import { ErrorMapper } from "utils/ErrorMapper";
import { RoleMapper } from "utils/RoleMapper";

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

        const roleClass = RoleMapper.mapEnumToClass(creep.memory.role as RoleName);

        if (roleClass === undefined) {
            return;
        }

        if (creep.isIdle) {
            roleClass.newTask(creep);
        }

        creep.run();
    }
});
