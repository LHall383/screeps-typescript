import { RoleName } from "enums/RoleName";
import { RoleHelpers } from "roles/helpers";
import { Tasks } from "../../creep-tasks/Tasks";
import { Role } from "../Role";

export class RoleBuilder extends Role {
    public static roleName: RoleName = RoleName.Builder;

    public newTask(creep: Creep): boolean {
        if (creep.store.energy < creep.store.getCapacity()) {
            // Pull energy from storage
            if (creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                creep.task = Tasks.withdraw(creep.room.storage, RESOURCE_ENERGY);
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

            // Resort to harvesting if no containers or storage
            const sources = creep.room.find(FIND_SOURCES_ACTIVE);
            if (sources != null) {
                const bestSource = RoleHelpers.getBestHarvestSource(creep, sources);
                creep.task = Tasks.harvest(bestSource);
                return true;
            }

            // No task found
            return false;
        }

        // Find construction sites
        const constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (constructionSites.length) {
            creep.task = Tasks.build(constructionSites[0]);
            return true;
        }

        // Repair main structures if no construction sites
        const mainRepairs = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: RoleHelpers.filterMainRepairs
        });
        if (mainRepairs != null) {
            creep.task = Tasks.repair(mainRepairs);
            return true;
        }

        // Upgrade as a last resort
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return true;
        }

        // No task found
        return false;
    }
}
