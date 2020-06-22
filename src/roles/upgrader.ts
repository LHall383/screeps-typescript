import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleUpgrader extends Role {
    public static roleName: RoleName = RoleName.Upgrader;

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

        // Upgrade Room Controller
        if (creep.room.controller) {
            creep.task = Tasks.upgrade(creep.room.controller);
            return;
        }
    }
}
