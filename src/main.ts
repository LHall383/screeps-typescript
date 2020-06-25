import { AutoSpawn } from "autospawn/auto_spawn";
import "creep-tasks/prototypes";
import { RoleName } from "enums/RoleName";
import { roleDictionary } from "roles";
import { ErrorMapper } from "utils/ErrorMapper";
import { AutoBuilding } from "autobuilding/auto_base_building"

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
        if (!room.memory.locationUtilization) {
            room.memory.locationUtilization = [];
            for (let i = 0; i < 50; i++) {
                let dummyArray = [];
                for (let j = 0; j < 50; j++) {
                    dummyArray[j] = 0;
                }
                room.memory.locationUtilization[i] = dummyArray;
            }
        }

        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            AutoSpawn.queueSpawns(room);
            AutoSpawn.spawnFromQueue(room);
        }
        if (Game.time % 1000 === 0) {
            AutoBuilding.placeRoads(room);
        }
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
