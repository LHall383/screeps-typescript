import { Task } from "../Task";
// import { EnergyStructure, isEnergyStructure, isStoreStructure, StoreStructure } from '../utilities/helpers';

export type transferTargetType =
    | StructureLab
    | StructureNuker
    | StructurePowerSpawn
    | StructureSpawn
    | StructureExtension
    | StructureTower
    | Creep;

export class TaskTransfer extends Task {
    static taskName = "transfer";

    public target: transferTargetType;
    public data: {
        resourceType: ResourceConstant;
        amount: number | undefined;
    };

    constructor(
        target: transferTargetType,
        resourceType: ResourceConstant = RESOURCE_ENERGY,
        amount: number | undefined = undefined,
        options = {} as TaskOptions
    ) {
        super(TaskTransfer.taskName, target, options);
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
        const resourcesInCarry = this.creep.carry[this.data.resourceType] || 0;

        return resourcesInCarry >= amount;
    }

    public isValidTarget() {
        const amount = this.data.amount || 1;
        const target = this.target;

        return target.store.getFreeCapacity(this.data.resourceType) >= amount;
    }

    public work() {
        return this.creep.transfer(this.target, this.data.resourceType, this.data.amount);
    }
}
