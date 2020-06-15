import { Tasks } from '../creep-tasks/Tasks';

export class RoleHarvester {
    static roleName: string = 'harvester';

    static newTask(creep: Creep): void {
        if (creep.carry.energy < creep.carryCapacity) {
            //find the source with the least miners currently on it
            let sources = creep.room.find(FIND_SOURCES);
            let leastBusySource = _.sortBy(sources, source => source.targetedBy.length)[0];
            creep.task = Tasks.harvest(leastBusySource);
        } else {
            //Look for spawns that aren't full first
            let spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, { filter: spawn => spawn.store[RESOURCE_ENERGY] < spawn.store.getCapacity(RESOURCE_ENERGY) });
            if (spawn) {
                creep.task = Tasks.transfer(spawn);
                return;
            }

            //Look for extensions that aren't full next
            let extension = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_EXTENSION && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY) });
            if (extension && extension.structureType == STRUCTURE_EXTENSION) {
                creep.task = Tasks.transfer(extension);
                return;
            }

            //TODO: fill towers, storage, etc.
        }
    }
}
