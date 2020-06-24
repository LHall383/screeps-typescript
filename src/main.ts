import { AutoSpawn } from "autospawn/auto_spawn";
import "creep-tasks/prototypes";
import { RoleName } from "enums/RoleName";
import { roleDictionary } from "roles";
import { ErrorMapper } from "utils/ErrorMapper";
import { AutoBaseBuilding } from "autobuilding/auto_base_building";
import { AutoBasePlanning } from "autobuilding/auto_base_planning";
import { BuildQueue } from "autobuilding/build_queue";

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

    // Look through all rooms
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        // If we own a spawn, perform autospawning
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            AutoSpawn.queueSpawns(room);
            AutoSpawn.spawnFromQueue(room);
        }

        // If we own this room, then perform base planning
        if (room.controller && room.controller.my) {
            AutoBasePlanning.planCoreLayout(room);
        }

        AutoBaseBuilding.placeContainers(room);
        BuildQueue.buildFromQueue(room);
    }

    // Search through all the creeps in the game, and perform actions
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const roleClass = roleDictionary[creep.memory.role as RoleName];

        if (!roleClass) {
            return;
        }

        if (creep.isIdle) {
            roleClass.newTask(creep);
        }

        creep.run();
    }
});
