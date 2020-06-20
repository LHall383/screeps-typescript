import { Task } from "../Task";

export type upgradeTargetType = StructureController;

export class TaskUpgrade extends Task {
    public static taskName = "upgrade";
    public target: upgradeTargetType;

    constructor(target: upgradeTargetType, options = {} as TaskOptions) {
        super(TaskUpgrade.taskName, target, options);
        this.target = target;

        // Settings
        this.settings.targetRange = 3;
        this.settings.workOffRoad = true;
    }

    public isValidTask() {
        console.log(this.creep.store);
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }

    public isValidTarget() {
        return this.target && this.target.my;
    }

    public work() {
        return this.creep.upgradeController(this.target);
    }
}
