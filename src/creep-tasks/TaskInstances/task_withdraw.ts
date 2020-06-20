/* This is the withdrawal task for non-energy resources. */

import { Task } from "../Task";

export type withdrawTargetType = StructureStorage | StructureContainer | StructureLab | StructureNuker | StructurePowerSpawn | Tombstone;

export class TaskWithdraw extends Task {
    static taskName = "withdraw";
    public target: withdrawTargetType;
    public data: {
        resourceType: ResourceConstant;
        amount: number | undefined;
    };

    constructor(
        target: withdrawTargetType,
        resourceType: ResourceConstant = RESOURCE_ENERGY,
        amount: number | undefined = undefined,
        options = {} as TaskOptions
    ) {
        super(TaskWithdraw.taskName, target, options);
        this.target = target;

        // Settings
        this.settings.oneShot = true;
        this.data = {
            resourceType,
            amount
        };
    }

    public isValidTask() {
        const amount = this.data.amount || 1;
        return this.creep.store.getUsedCapacity() <= this.creep.store.getCapacity() - amount;
    }

    public isValidTarget() {
        const amount = this.data.amount || 1;
        const target = this.target;

        return (target.store as GenericStore)[this.data.resourceType] >= amount;
    }

    public work() {
        return this.creep.withdraw(this.target, this.data.resourceType, this.data.amount);
    }
}
