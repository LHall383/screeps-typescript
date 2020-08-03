import { Dictionary } from "lodash";

export class BuildQueue {
    private static buildPriorities: Record<BuildableStructureConstant, number> = {
        "spawn": 1,                 // reserve 1-3 for all spawns
        "extension": 5,             // reserve 5-65 for all extensions
        "container": 70,            // reserve 70-74 for containers (if order matters)
        "tower": 80,                // reserve 80-85 for all towers
        "storage": 90,
        "terminal": 100,
        "lab": 110,                 // reserve 110-115 for all labs
        "link": 120,
        "road": 130,                // reserve up to 999 for these (helps with planning paths that should be constructed sequentially)
        "extractor": 1000,
        "constructedWall": 1010,    // leave up to 1999
        "rampart": 2000,            // leave up to 2499
        "observer": 2500,
        "powerSpawn": 2510,
        "nuker": 2520,
        "factory": 2530
    };

    public static getBuildPriority(structureType: BuildableStructureConstant): number {
        switch (structureType) {
            case STRUCTURE_SPAWN:
                return this.buildPriorities.spawn;
            case STRUCTURE_EXTENSION:
                return this.buildPriorities.extension;
            case STRUCTURE_CONTAINER:
                return this.buildPriorities.container;
            case STRUCTURE_TOWER:
                return this.buildPriorities.tower;
            case STRUCTURE_STORAGE:
                return this.buildPriorities.storage;
            case STRUCTURE_TERMINAL:
                return this.buildPriorities.terminal;
            case STRUCTURE_LAB:
                return this.buildPriorities.lab;
            case STRUCTURE_LINK:
                return this.buildPriorities.link;
            case STRUCTURE_ROAD:
                return this.buildPriorities.road;
            case STRUCTURE_EXTRACTOR:
                return this.buildPriorities.extractor;
            case STRUCTURE_WALL:
                return this.buildPriorities.constructedWall;
            case STRUCTURE_RAMPART:
                return this.buildPriorities.rampart;
            case STRUCTURE_OBSERVER:
                return this.buildPriorities.observer;
            case STRUCTURE_POWER_SPAWN:
                return this.buildPriorities.powerSpawn;
            case STRUCTURE_NUKER:
                return this.buildPriorities.nuker;
            case STRUCTURE_FACTORY:
                return this.buildPriorities.factory;
            default:
                return Infinity;
        }
    };

    // Add a request to build queue if valid, lower priority number is higher priority
    public static addToBuildQueue(room: Room, request: BuildQueueRequest): boolean {
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];

        // get the actual position object, if this fails, we cannot queue build requests
        const requestPosition = room.getPositionAt(request.location.x, request.location.y);
        if (requestPosition === null) {
            return false;
        }

        // if construction site already exists
        const sites = requestPosition.lookFor(LOOK_CONSTRUCTION_SITES);
        if (sites.length > 0 && _.filter(sites, site => site.structureType === request.structType).length > 0) {
            return false;
        }

        // if request already exists in queue, do not requeue
        if (_.filter(room.memory.buildQueue, r => r.structType === request.structType && r.location === request.location).length > 0) {
            return false;
        }

        // add request to build queue
        room.memory.buildQueue.push(request);
        return true;
    }

    public static buildFromQueue(room: Room) {
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];

        // only build from queue, if there are not already 3 construction sites in the room
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (sites.length > 2) {
            return;
        }

        // sort the build queue
        const sortedQueue = _.sortBy(room.memory.buildQueue, request => request.priority);

        // pull the highest priority item from the build queue that can be placed
        for (const request of sortedQueue) {
            const buildPosition = room.getPositionAt(request.location.x, request.location.y);
            if (buildPosition === null) {
                continue;
            }

            const response = buildPosition.createConstructionSite(request.structType);
            if (response === OK) {
                return;
            } else {
                continue;
            }
        }
    }
}
