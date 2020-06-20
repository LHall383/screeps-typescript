import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleHarvester extends Role {
    public static roleName: string = RoleName.Harvester;

    public newTask(creep: Creep): void {
        if (creep.carry.energy < creep.carryCapacity) {
            // find the source with the least miners currently on it
            const sources = creep.room.find(FIND_SOURCES);
            const leastBusySource = _.sortBy(sources, source => source.targetedBy.length)[0];
            creep.task = Tasks.harvest(leastBusySource);
            return;
        }

        // Look for spawns that aren't full first
        const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter: spawn => spawn.store[RESOURCE_ENERGY] < spawn.store.getCapacity(RESOURCE_ENERGY)
        });
        if (spawn) {
            creep.task = Tasks.transfer(spawn);
            return;
        }

        // Look for extensions that aren't full next
        const extension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY)
        });
        if (extension && extension.structureType === STRUCTURE_EXTENSION) {
            creep.task = Tasks.transfer(extension);
            return;
        }

        // Look for tower that isn't full
        const tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY)
        });
        if (tower && tower.structureType === STRUCTURE_TOWER) {
            creep.task = Tasks.transfer(tower);
            return;
        }

        // Build instead
        const sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (sites.length) {
            creep.task = Tasks.build(sites[0]);
            return;
        }

        // Upgrade instead
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return;
        }
    }
}
