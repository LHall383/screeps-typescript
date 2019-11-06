import { ErrorMapper } from "utils/ErrorMapper";
import 'creep-tasks/prototypes';
import { Tasks } from 'creep-tasks/Tasks';
import { RoleHarvester } from 'roles/harvester';

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

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        if (creep.isIdle && creep.memory.role == RoleHarvester.roleName) {
            console.log(creep.name + ' finding new task');
            RoleHarvester.newTask(creep);
        } else if (creep.isIdle) {
            if (creep.carry.energy < creep.carryCapacity) {
                let sources = creep.room.find(FIND_SOURCES);
                creep.task = Tasks.harvest(sources[0]);
            } else {
                let dest = Game.spawns['Spawn1'];
                creep.task = Tasks.transfer(dest);
            }
        }

        creep.run();
    }
});
