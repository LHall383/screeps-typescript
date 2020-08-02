import { RoleName } from "enums/RoleName";
import { RoleHelpers } from "roles/helpers";
import { Tasks } from "../../creep-tasks/Tasks";
import { Role } from "../Role";
import { RoleBuilder } from "./builder";

export class RoleHarvester extends Role {
    public static roleName: string = RoleName.Harvester;

    public newTask(creep: Creep): boolean {
        if (creep.store.energy < creep.store.getCapacity()) {
            // find best source to harvest from
            const sources = creep.room.find(FIND_SOURCES_ACTIVE);
            if (sources != null) {
                const bestSource = RoleHelpers.getBestHarvestSource(creep, sources);
                creep.task = Tasks.harvest(bestSource);
                return true;
            }

            // Pull energy from storage
            if (creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                creep.task = Tasks.withdraw(creep.room.storage, RESOURCE_ENERGY);
                return true;
            }

            // Pickup dropped energy past a certain threshold
            const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (d) => d.resourceType === RESOURCE_ENERGY && d.amount > 100 });
            if (droppedEnergy != null) {
                creep.task = Tasks.pickup(droppedEnergy);
                return true;
            }

            // Withdraw from containers
            const containersWithEnergy = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            }) as StructureContainer[];
            if (containersWithEnergy.length > 0) {
                creep.task = Tasks.withdraw(containersWithEnergy[0], RESOURCE_ENERGY);
                return true;
            }
        }

        // Look for spawns that aren't full first
        const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter: s => s.store.getUsedCapacity(RESOURCE_ENERGY) < s.store.getCapacity(RESOURCE_ENERGY)
        });
        if (spawn) {
            creep.task = Tasks.transfer(spawn);
            return true;
        }

        // Look for extensions that aren't full next
        const extension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_EXTENSION && s.store.getUsedCapacity(RESOURCE_ENERGY) < s.store.getCapacity(RESOURCE_ENERGY)
        });
        if (extension && extension.structureType === STRUCTURE_EXTENSION) {
            creep.task = Tasks.transfer(extension);
            return true;
        }

        // Look for tower that isn't full
        const tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_TOWER && s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY)
        });
        if (tower && tower.structureType === STRUCTURE_TOWER) {
            creep.task = Tasks.transfer(tower);
            return true;
        }

        // Build instead
        const sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (sites.length) {
            creep.task = Tasks.build(sites[0]);
            return true;
        }

        // Repair main structures instead
        const mainRepairs = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: RoleHelpers.filterMainRepairs
        });
        if (mainRepairs != null) {
            creep.task = Tasks.repair(mainRepairs);
            return true;
        }

        // Upgrade instead
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return true;
        }

        // No task found
        return false;
    }
}
