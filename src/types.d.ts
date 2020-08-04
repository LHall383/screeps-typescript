// example declaration file - remove these and add your own custom typings
type Coordinate = {
    x: number;
    y: number;
}

type BuildQueueRequest = {
    structType: BuildableStructureConstant;
    location: Coordinate;
    priority: number;
};

// memory extension samples
interface CreepMemory {
    role: string;
    working: boolean;
    spawnRoom: string;
}

interface RoomMemory {
    // base planning
    basePlan: { corner: Coordinate; center: Coordinate; labCorner: Coordinate; };
    buildQueue: BuildQueueRequest[];
    hasPlacedContainerSites: boolean;

    // creep spawning
    creepRoleCounts: {
        data: { [role: string]: number };
        tick: number;
    };
    spawnQueue: { memory: CreepMemory; body: BodyPartConstant[] }[];

    // statistics
    locationUtilization: number[][];
}

interface Memory {
    uuid: number;
    log: any;
}

interface StoreBase<POSSIBLE_RESOURCES extends ResourceConstant, UNLIMITED_STORE extends boolean> {
    getFreeCapacity(resource: ResourceConstant): number;
}

// `global` extension samples
declare namespace NodeJS {
    interface Global {
        log: any;
    }
}

interface RoomObject {
    id: string;
}
