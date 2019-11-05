import { Tasks } from '../creep-tasks/Tasks';

export class RoleHarvester {

    static newTask(creep: Creep): void {
        if (creep.carry.energy < creep.carryCapacity) {
            let sources = creep.room.find(FIND_SOURCES);
            let unattendedSource = _.filter(sources, source => source.targetedBy.length == 0)[0];
            if (unattendedSource) {
                creep.task = Tasks.harvest(unattendedSource);
            } else {
                creep.task = Tasks.harvest(sources[0]);
            }
        } else {
            let spawn = Game.spawns['Spawn1'];
            creep.task = Tasks.transfer(spawn);
        }
    }
}
