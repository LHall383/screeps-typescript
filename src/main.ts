import { AutoBaseBuilding } from "autobuilding/auto_base_building";
import { AutoBasePlanning } from "autobuilding/auto_base_planning";
import { BuildQueue } from "autobuilding/build_queue";
import { AutoSpawn } from "autospawn/auto_spawn";
import "creep-tasks/prototypes";
import { RoleName } from "enums/RoleName";
import { roleDictionary } from "roles";
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

    // Look through all rooms
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room.memory.locationUtilization) {
            room.memory.locationUtilization = [];
            for (let i = 0; i < 50; i++) {
                const dummyArray = [];
                for (let j = 0; j < 50; j++) {
                    dummyArray[j] = 0;
                }
                room.memory.locationUtilization[i] = dummyArray;
            }
        }

        // If we own a spawn, perform autospawning
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            AutoSpawn.queueSpawns(room);
            AutoSpawn.spawnFromQueue(room);
        }

        // If we own this room, then perform base planning
        if (room.controller && room.controller.my && Game.time % 10 === 0) {
            AutoBasePlanning.planCoreLayout(room);
            AutoBasePlanning.planLabLayout(room);
            AutoBasePlanning.planExtensions(room);
            AutoBaseBuilding.placeContainers(room);
            AutoBaseBuilding.placeRoads(room);
        }

        // Build from the queue for all rooms we can see
        BuildQueue.buildFromQueue(room);
        BuildQueue.visualizeBuildQueue(room);
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
