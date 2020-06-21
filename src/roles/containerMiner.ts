import { RoleName } from "enums/RoleName";
import { Tasks } from "../creep-tasks/Tasks";
import { Role } from "./Role";

export class RoleContainerMiner extends Role {
    public static roleName: string = RoleName.ContainerMiner;

    public newTask(creep: Creep): void {
        const sources = creep.room.find(FIND_SOURCES_ACTIVE);
        const untargetedSources = [];
        var i;
        for (i in sources) {
            const targetingCreeps = sources[i].targetedBy;
            var j;
            var unmined = true;
            for (j in targetingCreeps) {
                if (targetingCreeps[j].memory.role == "containerMiner") {
                    unmined = false;
                }
            }
            if (unmined == true) {
                untargetedSources.push(sources[i]);
            }
        }

        if (untargetedSources.length > 0) {
            creep.task = Tasks.harvest(untargetedSources[0]);
            return;
        }
    }
}
