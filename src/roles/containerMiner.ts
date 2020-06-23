import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleContainerMiner extends Role {
    public static roleName: string = RoleName.ContainerMiner;

    public newTask(creep: Creep): void {
        // Find active sources
        const sources = creep.room.find(FIND_SOURCES_ACTIVE);
        const untargetedSources = [];
        var i;

        // Loop through sources to find which ones currently don't have a container miner on them
        for (i in sources) {
            const targetingCreeps = sources[i].targetedBy;
            var j;
            var unmined = true;
            for (j in targetingCreeps) {
                if (targetingCreeps[j].memory.role === "containerMiner") {
                    unmined = false;
                }
            }
            if (unmined === true) {
                untargetedSources.push(sources[i]);
            }
        }

        // Mine source without container miner already assigned to it
        if (untargetedSources.length > 0) {
            creep.task = Tasks.harvest(untargetedSources[0]);
            return;
        }
    }
}
