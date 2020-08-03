import { Task } from '../Task';

export type harvestTargetType = Source | Mineral;

function isSource(obj: Source | Mineral): obj is Source {
	return (obj as Source).energy !== undefined;
}

export class TaskHarvest extends Task {

	public static taskName = 'harvest';
	public target: harvestTargetType;

	constructor(target: harvestTargetType, options = {} as TaskOptions) {
		super(TaskHarvest.taskName, target, options);
		this.target = target;
	}

	public isValidTask() {
		return this.creep.store.getUsedCapacity() < this.creep.carryCapacity;
	}

	public isValidTarget() {
		if (this.target && (isSource(this.target) ? this.target.energy > 0 : this.target.mineralAmount > 0)) {
			// Valid only if there's enough space for harvester to work - prevents doing tons of useless pathfinding
			return this.target.pos.availableNeighbors().length > 0 || this.creep.pos.isNearTo(this.target.pos);
		}
		return false;
	}

	public work() {
		return this.creep.harvest(this.target);
	}
}
