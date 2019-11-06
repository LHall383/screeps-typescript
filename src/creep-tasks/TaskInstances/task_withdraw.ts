/* This is the withdrawal task for non-energy resources. */

import { Task } from '../Task';
//import {EnergyStructure, isEnergyStructure, isStoreStructure, StoreStructure} from '../utilities/helpers';

export type withdrawTargetType =
	StructureLab
	| StructureNuker
	| StructurePowerSpawn
	| Tombstone;

export class TaskWithdraw extends Task {

	static taskName = 'withdraw';
	target: withdrawTargetType;
	data: {
		resourceType: ResourceConstant,
		amount: number | undefined,
	};

	constructor(target: withdrawTargetType,
		resourceType: ResourceConstant = RESOURCE_ENERGY,
		amount: number | undefined = undefined,
		options = {} as TaskOptions) {
		super(TaskWithdraw.taskName, target, options);
		this.target = target;

		// Settings
		this.settings.oneShot = true;
		this.data = {
			resourceType: resourceType,
			amount: amount
		}
	}

	isValidTask() {
		let amount = this.data.amount || 1;
		return (_.sum(this.creep.carry) <= this.creep.carryCapacity - amount);
	}

	isValidTarget() {
		let amount = this.data.amount || 1;
		let target = this.target;

		return (<GenericStore>target.store)[this.data.resourceType] >= amount;
	}

	work() {
		return this.creep.withdraw(this.target, this.data.resourceType, this.data.amount);
	}

}
