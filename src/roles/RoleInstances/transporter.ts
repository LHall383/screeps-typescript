import { RoleName } from "enums/RoleName";
import { Tasks } from "../../creep-tasks/Tasks";
import { Role } from "../Role";

export class RoleTransporter extends Role {
    public static roleName: string = RoleName.Transporter;

    public newTask(creep: Creep): boolean {
        if (creep.store.energy < creep.store.getCapacity()) {
            // Withdraw from containers
            const containersWithEnergy = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            }) as StructureContainer[];
            if (containersWithEnergy.length > 0) {
                creep.task = Tasks.withdraw(containersWithEnergy[0], RESOURCE_ENERGY);
                return true;
            }

            // Pickup dropped energy
            const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
                filter: (d) => d.resourceType === RESOURCE_ENERGY
            });
            if (droppedEnergy !== null) {
                creep.task = Tasks.pickup(droppedEnergy);
                return true;
            }

            // Pull energy from storage, TODO: don't pull from storage if it will be depositing in storage
            if (creep.room.storage && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                creep.task = Tasks.withdraw(creep.room.storage, RESOURCE_ENERGY);
                return true;
            }

            // If energy is not available at the time continue to transfer tasks (minimize idle time)
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getCapacity() / 2) {
                return false;
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
            filter: s => s.structureType === STRUCTURE_TOWER && s.store.getUsedCapacity(RESOURCE_ENERGY) < s.store.getCapacity(RESOURCE_ENERGY)
        });
        if (tower && tower.structureType === STRUCTURE_TOWER) {
            creep.task = Tasks.transfer(tower);
            return true;
        }

        // Look for storage that isn't full
        const storage = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity() > 0
        });
        if (storage && storage.structureType === STRUCTURE_STORAGE) {
            creep.task = Tasks.transferAll(storage);
            return true;
        }

        // No task found
        return false;
    }
}
