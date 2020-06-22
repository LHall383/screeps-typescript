import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleRepairer extends Role {
    public static roleName: RoleName = RoleName.Repairer;

    public newTask(creep: Creep): void {
        if (creep.carry.energy < creep.carryCapacity) {
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


        // Repair main structures
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

        // Repair roads
        var roadRepairs = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_ROAD) && structure.hits < structure.hitsMax;
            }
        });
        if (roadRepairs != null) {
            creep.task = Tasks.repair(roadRepairs);
            return;
        }

        // Repair walls
        const wallRepairs = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType === STRUCTURE_WALL ||
                    s.structureType === STRUCTURE_RAMPART) && s.hits <= 20000;
            }
        });
        if (wallRepairs != null) {
            creep.task = Tasks.repair(wallRepairs);
            return;
        }

        // Upgrade if nothing left to repair
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return;
        }
    }
}
