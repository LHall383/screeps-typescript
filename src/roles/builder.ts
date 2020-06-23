import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleBuilder extends Role {
    public static roleName: RoleName = RoleName.Builder;

    public newTask(creep: Creep): void {
        if (creep.store.energy < creep.store.getCapacity()) {
            // Find Structures for getting energy
            const structures = creep.room.find(FIND_STRUCTURES);

            // Pull energy from storage
            const storageWithEnergy = structures.filter(s => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0) as StructureStorage[];
            if (storageWithEnergy.length > 0) {
                creep.task = Tasks.withdraw(storageWithEnergy[0], RESOURCE_ENERGY);
                return;
            }

            // Withdraw from containers
            const containersWithEnergy = structures.filter(s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0) as StructureContainer[];
            if (containersWithEnergy.length > 0) {
                creep.task = Tasks.withdraw(containersWithEnergy[0], RESOURCE_ENERGY);
                return;
            }

            // Resort to harvesting if no containers or storage
            const sources = creep.room.find(FIND_SOURCES_ACTIVE);
            const leastBusySource = _.sortBy(sources, source => source.targetedBy.length)[0];
            creep.task = Tasks.harvest(leastBusySource);
            return;
        }

        // Find construction sites
        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length) {
            creep.task = Tasks.build(constructionSites[0]);
            return;
        }

        // Repair main structures if no construction sites
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

        // Upgrade as a last resort
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return;
        }
    }
}
