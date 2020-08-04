import { BuildQueue } from "./build_queue";

export class AutoBaseBuilding {
    public static placeContainers(room: Room) {
        // TODO: This could probably be improved, we never check if containers get built correctly or anything
        if (room.memory.hasPlacedContainerSites) {
            return;
        }

        // Only run for rooms that already contain a spawn
        const sources = room.find(FIND_SOURCES);
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) {
            return;
        }

        // Get valid spots for containers to be placed
        sources.forEach(source => {
            const containerSiteOptions = source.pos.neighbors;

            const validContainerSitePositions = containerSiteOptions
                .filter(siteOption => this.isValidContainerPosition(room, siteOption.x, siteOption.y))
                .map(position => new RoomPosition(position.x, position.y, room.name))
                .sort(position => this.getPathLength(position, spawns[0].pos));

            if (validContainerSitePositions.length > 0) {
                const location = { x: validContainerSitePositions[0].x, y: validContainerSitePositions[0].y } as Coordinate;
                const request = { structType: STRUCTURE_CONTAINER, location, priority: BuildQueue.getBuildPriority(STRUCTURE_CONTAINER) } as BuildQueueRequest;

                // Currently hasPlacedContainerSites is set to true even if only one of these makes it into the build queue
                if (BuildQueue.addToBuildQueue(room, request)) {
                    room.memory.hasPlacedContainerSites = true;
                }
            }
        });
    }

    private static isValidContainerPosition(room: Room, x: number, y: number) {
        const positionObjects = room.lookAt(x, y);

        let isValidPosition = true;
        positionObjects.forEach(object => {
            // Filter out wall terrain
            if (object.type === LOOK_TERRAIN && object.terrain === "wall") {
                isValidPosition = false;
            }

            // Filter out structures that aren't roads or ramparts
            if (object.type === LOOK_STRUCTURES && object.structure && object.structure.structureType !== STRUCTURE_ROAD && object.structure.structureType !== STRUCTURE_RAMPART) {
                isValidPosition = false;
            }

            // Filter out construction sites that aren't roads or ramparts
            if (
                object.type === LOOK_CONSTRUCTION_SITES &&
                object.constructionSite &&
                object.constructionSite.structureType !== STRUCTURE_ROAD &&
                object.constructionSite.structureType !== STRUCTURE_CONTAINER &&
                object.constructionSite.structureType !== STRUCTURE_RAMPART
            ) {
                isValidPosition = false;
            }
        });

        return isValidPosition;
    }

    private static getPathLength(source: RoomPosition, dest: RoomPosition) {
        const path = source.findPathTo(dest);
        return path.length;
    }

    public static placeRoads(room: Room) {
        // Don't place roads if there is a structure (except ramparts)
        const structLocations = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType !== STRUCTURE_RAMPART
        }).map(s => [s.pos.x, s.pos.y]);

        // Don't place roads if there is currently a construction site
        room.find(FIND_CONSTRUCTION_SITES).map(s => [s.pos.x, s.pos.y]).forEach(t => {
            if (!this.locationIn(structLocations, t)) {
                structLocations.push(t);
            }
        });

        // Don't place roads if there is a build queue entry
        room.memory.buildQueue = room.memory.buildQueue || [] as BuildQueueRequest[];
        room.memory.buildQueue.map(req => [req.location.x, req.location.y]).forEach(t => {
            if (!this.locationIn(structLocations, t)) {
                structLocations.push(t);
            }
        });

        // Get max number of traversals
        let spotsForRoads = [];
        let max = 0;
        let sum = 0;
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                max = room.memory.locationUtilization[i][j] > max ? room.memory.locationUtilization[i][j] : max;
                sum += room.memory.locationUtilization[i][j];
            }
        }
        console.log("max traversal: " + max);

        // If the maximum is not at least 100, just exit
        if (max < 25) {
            return;
        }

        // If a location accounts for more than 2% of all travel (not on roads), place a road
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                const position = [i, j];
                if (!this.locationIn(structLocations, position)) {
                    const c = room.memory.locationUtilization[i][j];
                    if ((c / sum) > .02) {
                        spotsForRoads.push({ x: i, y: j, count: c });
                    }
                }
            }
        }

        // Sort by traversal count
        spotsForRoads = spotsForRoads.sort((a, b) => b.count - a.count);
        console.log(JSON.stringify(spotsForRoads));

        const maxStructuresPerCycle = 100;
        let addedStructureCount = 0;

        spotsForRoads.forEach(
            spot => {
                if (addedStructureCount < maxStructuresPerCycle) {
                    // Add road to the build queue
                    const location = new RoomPosition(spot.x, spot.y, room.name);
                    const priority = BuildQueue.getBuildPriority(STRUCTURE_ROAD) + addedStructureCount;
                    const request = { structType: STRUCTURE_ROAD, location, priority } as BuildQueueRequest;
                    const result = BuildQueue.addToBuildQueue(room, request);
                    console.log("Adding " + JSON.stringify(request) + " to build queue was " + (result ? "sucessfull" : "unsucessfull"));
                    addedStructureCount++;
                    console.log("adding roads");
                }
            }
        )
    }

    private static locationIn(list: number[][], value: number[]) {
        let output = false;
        for (const pair of list) {
            if (pair[0] === value[0] && pair[1] === value[1]) {
                output = true;
                break;
            }
        }
        return output;
    }
}
