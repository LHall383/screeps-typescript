export class BuildQueue {
    private static buildPriorities: Record<BuildableStructureConstant, number> = {
        [STRUCTURE_SPAWN]: 1,                 // reserve 1-3 for all spawns
        [STRUCTURE_EXTENSION]: 5,             // reserve 5-65 for all extensions
        [STRUCTURE_CONTAINER]: 70,            // reserve 70-74 for containers (if order matters)
        [STRUCTURE_TOWER]: 80,                // reserve 80-85 for all towers
        [STRUCTURE_STORAGE]: 90,
        [STRUCTURE_TERMINAL]: 100,
        [STRUCTURE_LAB]: 110,                 // reserve 110-115 for all labs
        [STRUCTURE_LINK]: 120,
        [STRUCTURE_ROAD]: 130,                // reserve up to 999 for these (helps with planning paths that should be constructed sequentially)
        [STRUCTURE_EXTRACTOR]: 1000,
        [STRUCTURE_WALL]: 1010,               // leave up to 1999
        [STRUCTURE_RAMPART]: 2000,            // leave up to 2499
        [STRUCTURE_OBSERVER]: 2500,
        [STRUCTURE_POWER_SPAWN]: 2510,
        [STRUCTURE_NUKER]: 2520,
        [STRUCTURE_FACTORY]: 2530,
    };

    public static getBuildPriority(structureType: BuildableStructureConstant): number {
        if (!this.buildPriorities.hasOwnProperty(structureType)) {
            console.log(`Build queue doesn't have a definition for ${structureType}`)
            return Infinity;
        }

        return this.buildPriorities[structureType];
    };

    /* Retreive instance of build queue, init if neccessary */
    public static getBuildQueue(room: Room): BuildQueueRequest[] {
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];
        return room.memory.buildQueue;
    }

    /* Retreive the entries matching a specific structure type */
    public static getEntriesOfType(room: Room, structType: BuildableStructureConstant): BuildQueueRequest[] {
        const buildQueue = this.getBuildQueue(room);
        return _.filter(buildQueue, req => req.structType === structType);
    }

    /* Retreive the entries at a specific location */
    public static getEntriesAtLocation(room: Room, x: number, y: number): BuildQueueRequest[] {
        const buildQueue = this.getBuildQueue(room);
        return _.filter(buildQueue, req => req.location.x === x && req.location.y === y);
    }

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

    // Remove the specified item from the build queue
    private static removeFromQueue(room: Room, request: BuildQueueRequest) {
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];

        _.remove(room.memory.buildQueue, req => {
            return req.location.x === request.location.x
                && req.location.y === request.location.y
                && req.structType === request.structType
                && req.priority === request.priority;
        });
    }

    // Build the highest priority item from the queue if possible
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
                // remove the item from the build queue
                this.removeFromQueue(room, request);
                return;
            } else {
                continue;
            }
        }
    }

    public static visualizeBuildQueue(room: Room) {
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];

        // loop through queue
        room.memory.buildQueue.forEach(request => {
            // draw a shape for each type of structure
            switch (request.structType) {
                case STRUCTURE_SPAWN:
                    room.visual.circle(request.location.x, request.location.y, { fill: 'green' });
                    break;
                case STRUCTURE_ROAD:
                    room.visual.circle(request.location.x, request.location.y, { fill: '#CCCCCC', radius: 0.1 });
                    break;
                case STRUCTURE_EXTENSION:
                    room.visual.circle(request.location.x, request.location.y, { fill: '#C8D44C' });
                    break;
                case STRUCTURE_TOWER:
                    room.visual.rect(request.location.x - .25, request.location.y - .25, .5, .5, { fill: 'red' });
                    break;
                case STRUCTURE_LAB:
                    room.visual.circle(request.location.x, request.location.y, { fill: '#2F7AA8' });
                    break;
                default:
                    room.visual.circle(request.location.x, request.location.y, { fill: 'black' });
                    break;
            }
        });
    }
}
