import { Dictionary } from "lodash";

export class BuildQueue {
    public static buildPriorities: Map<BuildableStructureConstant, number> = new Map([
        [STRUCTURE_SPAWN, 1],       // reserve 1-3 for all spawns
        [STRUCTURE_EXTENSION, 5],   // reserve 5-65 for all extensions
        [STRUCTURE_CONTAINER, 70],  // reserve 70-74 for containers (if order matters)
        [STRUCTURE_TOWER, 80],      // reserve 80-85 for all towers
        [STRUCTURE_STORAGE, 90],
        [STRUCTURE_TERMINAL, 100],
        [STRUCTURE_LAB, 110],       // reserve 110-115 for all labs
        [STRUCTURE_LINK, 120],
        [STRUCTURE_ROAD, 130],      // reserve up to 999 for these (helps with planning paths that should be constructed sequentially)
        [STRUCTURE_EXTRACTOR, 1000],
        [STRUCTURE_WALL, 1010],     // leave up to 1999
        [STRUCTURE_RAMPART, 2000],  // leave up to 2499
        [STRUCTURE_OBSERVER, 2500],
        [STRUCTURE_POWER_SPAWN, 2510],
        [STRUCTURE_NUKER, 2520]
    ]);

    public static addToBuildQueue(room: Room, request: BuildQueueRequest) {
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];

        // get the actual position object, if this fails, we cannot queue build requests
        const requestPosition = room.getPositionAt(request.location.x, request.location.y);
        if (requestPosition === null) {
            return;
        }

        // if construction site already exists
        const sites = requestPosition.lookFor(LOOK_CONSTRUCTION_SITES);
        if (sites.length > 0 && _.filter(sites, site => site.structureType === request.structType).length > 0) {
            return;
        }

        // if request already exists in queue, do not requeue
        if (_.filter(room.memory.buildQueue, r => r.structType === request.structType && r.location === request.location).length > 0) {
            return;
        }

        // add request to build queue
        room.memory.buildQueue.push(request);
    }
}
