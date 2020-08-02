// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
    role: string;
    working: boolean;
    spawnRoom: string;
}

interface RoomMemory {
    creepRoleCounts: {
        data: { [role: string]: number };
        tick: number;
    };

    hasPlacedContainerSites: boolean;

    spawnQueue: { memory: CreepMemory; body: BodyPartConstant[] }[];

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
