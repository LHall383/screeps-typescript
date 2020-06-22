import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleTransporter extends Role {
    public static roleName: string = RoleName.Transporter;

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

            // If energy is not available at the time continue to transfer tasks (minimize idle time)
            if (creep.carry.energy < creep.carryCapacity / 2) {
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

        // Look for storage that isn't full
        const storage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity() > 0
        });
        if (storage && storage.structureType === STRUCTURE_STORAGE) {
            creep.task = Tasks.transferAll(storage);
            return;
        }
    }
}
