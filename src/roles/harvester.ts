import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleHarvester extends Role {
    public static roleName: string = RoleName.Harvester;

    public newTask(creep: Creep): void {
        if (creep.carry.energy < creep.carryCapacity) {
            // find the active source with the least harvesters currently on it
            const sources = creep.room.find(FIND_SOURCES_ACTIVE);
            if (sources != null) {
                const leastBusySource = _.sortBy(sources, source => source.targetedBy.length)[0];
                creep.task = Tasks.harvest(leastBusySource);
                return;
            }

            // find other energy sources if no in game sources are active
            const structures = creep.room.find(FIND_STRUCTURES);

            // Pull energy from storage
            const storageWithEnergy = structures.filter(s => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0) as StructureStorage[];
            if (storageWithEnergy.length > 0) {
                creep.task = Tasks.withdraw(storageWithEnergy[0], RESOURCE_ENERGY);
                return;
            }

            // Pickup dropped energy
            const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.resourceType === RESOURCE_ENERGY });
            if (droppedEnergy != null) {
                creep.task = Tasks.pickup(droppedEnergy);
                return;
            }

            // Withdraw from containers
            const containersWithEnergy = structures.filter(s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0) as StructureContainer[];
            if (containersWithEnergy.length > 0) {
                creep.task = Tasks.withdraw(containersWithEnergy[0], RESOURCE_ENERGY);
                return;
            }
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

        //Repair main structures instead
        const mainRepairs = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => {
                return (s.structureType === STRUCTURE_EXTENSION ||
                    s.structureType === STRUCTURE_SPAWN ||
                    s.structureType === STRUCTURE_TOWER ||
                    s.structureType === STRUCTURE_LAB ||
                    s.structureType === STRUCTURE_STORAGE ||
                    s.structureType === STRUCTURE_NUKER ||
                    s.structureType === STRUCTURE_TERMINAL ||
                    s.structureType === STRUCTURE_OBSERVER ||
                    s.structureType === STRUCTURE_PORTAL ||
                    s.structureType === STRUCTURE_POWER_BANK ||
                    s.structureType === STRUCTURE_POWER_SPAWN ||
                    s.structureType === STRUCTURE_EXTRACTOR ||
                    s.structureType === STRUCTURE_FACTORY ||
                    s.structureType === STRUCTURE_LINK ||
                    s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax;
            }
        });
        if (mainRepairs != null) {
            creep.task = Tasks.repair(mainRepairs);
            return;
        }

        // Upgrade instead
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return;
        }
    }
}
