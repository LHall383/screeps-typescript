import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleBuilder extends Role {
    public static roleName: RoleName = RoleName.Builder;

    public newTask(creep: Creep): void {
        if (creep.carry.energy < creep.carryCapacity) {
            // Withdraw from containers
            const structures = creep.room.find(FIND_STRUCTURES);
            const containers = structures.filter(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer[];

            if (containers.length > 0) {
                creep.task = Tasks.withdraw(containers[0], RESOURCE_ENERGY);
                return;
            }

            // Resort to harvesting if no containers
            const sources = creep.room.find(FIND_SOURCES);
            const leastBusySource = _.sortBy(sources, source => source.targetedBy.length)[0];
            creep.task = Tasks.harvest(leastBusySource);
            return;
        }

        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length) {
            creep.task = Tasks.build(constructionSites[0]);
            return;
        }

        // Upgrade as a last resort
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return;
        }
    }
}
