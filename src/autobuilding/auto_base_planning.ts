import { BuildQueue } from "./build_queue";

export class AutoBasePlanning {
    public static coreLayout = [
        [STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_NUKER, STRUCTURE_SPAWN, STRUCTURE_POWER_SPAWN, STRUCTURE_ROAD, STRUCTURE_ROAD],
        [STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_TOWER],
        [STRUCTURE_FACTORY, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_EXTENSION],
        [STRUCTURE_ROAD, STRUCTURE_OBSERVER, STRUCTURE_ROAD, STRUCTURE_STORAGE, STRUCTURE_ROAD, STRUCTURE_LINK, STRUCTURE_ROAD],
        [STRUCTURE_SPAWN, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_SPAWN],
        [STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_TOWER, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_TOWER],
        [STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_TERMINAL, STRUCTURE_ROAD, STRUCTURE_ROAD, STRUCTURE_ROAD]
    ] as BuildableStructureConstant[][];

    public static corePriorityIncrease = [
        [0, 0, 0, 0, 0, 0, 0],
        [3, 0, 0, 0, 0, 0, 4],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 2],
        [1, 0, 0, 5, 0, 0, 2],
        [0, 0, 0, 0, 0, 0, 0]
    ];

    public static labLayout = [
        [STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD],
        [STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB],
        [STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB],
        [STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB],
        [STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD, STRUCTURE_LAB, STRUCTURE_ROAD],
    ] as BuildableStructureConstant[][];

    public static labPriorityIncrease = [
        [9, 2, 9, 9, 9],
        [3, 9, 0, 9, 8],
        [4, 9, 1, 9, 7],
        [9, 5, 9, 6, 9]
    ];

    /* Check if the provided layout is constructible in the position provided */
    private static canPlaceLayout(layout: BuildableStructureConstant[][], layoutWidth: number, layoutHeight: number, checkPos: RoomPosition, checkRoom: Room): boolean {
        // Get terrain map
        const terrain = checkRoom.getTerrain();

        // Locate sources
        const sources = checkRoom.find(FIND_SOURCES);

        for (let checkX = checkPos.x; checkX < checkPos.x + layoutWidth; checkX++) {
            for (let checkY = checkPos.y; checkY < checkPos.y + layoutHeight; checkY++) {
                // Can't build on walls
                if (terrain.get(checkX, checkY) === TERRAIN_MASK_WALL) {
                    return false;
                }
                // Don't want to build directly next to a source
                if ((sources[0] && checkPos.isNearTo(sources[0]))
                    || (sources[1] && checkPos.isNearTo(sources[1]))) {
                    return false;
                }
            }
        }

        return true;
    }

    /* Calculate a fitness score for a base centered at the provided position, lower score is better */
    private static calcBaseFitness(room: Room, baseCenter: RoomPosition): number {
        let score = 0;

        // Prefer locations that are further from exits
        const closestExit = baseCenter.findClosestByRange(FIND_EXIT);
        if (closestExit) {
            const rangeFromExit = baseCenter.getRangeTo(closestExit);
            score -= rangeFromExit;
        }

        // Prefer locations that are closer to sources
        const sources = room.find(FIND_SOURCES);
        if (sources.length === 2) {
            const rangeFromSource0 = baseCenter.getRangeTo(sources[0]);
            const rangeFromSource1 = baseCenter.getRangeTo(sources[1]);
            score += (rangeFromSource0 + rangeFromSource1);
        } else if (sources.length === 4 && room.name === 'sim') {
            const rangeFromSource0 = baseCenter.getRangeTo(sources[0]);
            const rangeFromSource1 = baseCenter.getRangeTo(sources[3]);
            score += (rangeFromSource0 + rangeFromSource1);
        }

        // Prefer locations that are closer to the controller
        if (room.controller) {
            const rangeFromController = baseCenter.getRangeTo(room.controller);
            score += rangeFromController;
        }

        return score;
    }

    /* Plan the fixed core layout of the room and add to build queue */
    public static planCoreLayout(room: Room) {
        // check if this room has already been planned for, if so, exit early
        room.memory.basePlan = room.memory.basePlan || {} as { corner: Coordinate; center: Coordinate; };
        if (room.memory.basePlan.center) {
            return;
        }

        // read some properties from the core layout
        const layoutWidth = this.coreLayout[0].length;
        const layoutHeight = this.coreLayout.length;

        // search through every possible location in the room
        const possibleLocations = [] as Array<{ corner: Coordinate; center: Coordinate; score: number }>;
        for (let x = 1; x < 49 - layoutWidth; x++) {
            for (let y = 1; y < 49 - layoutHeight; y++) {
                // get associated room position object
                const pos = room.getPositionAt(x, y) || new RoomPosition(x, y, room.name);

                // check if layout can be placed
                const canPlace = this.canPlaceLayout(this.coreLayout, layoutWidth, layoutHeight, pos, room);

                // get a score for this base location
                if (canPlace) {
                    const centerX = Math.floor(x + layoutWidth / 2);
                    const centerY = Math.floor(y + layoutHeight / 2);
                    const baseCenter = room.getPositionAt(centerX, centerY) || new RoomPosition(centerX, centerY, room.name);
                    const score = this.calcBaseFitness(room, baseCenter);

                    possibleLocations.push({
                        corner: { x, y },
                        center: { x: centerX, y: centerY },
                        score
                    } as { corner: Coordinate; center: Coordinate, score: number });
                }
            }
        }

        // pick best base location
        const sortedLocations = _.sortBy(possibleLocations, location => location.score)
        const best = sortedLocations[0];
        room.memory.basePlan.corner = best.corner;
        room.memory.basePlan.center = best.center;
        const bestCenter = room.getPositionAt(best.center.x, best.center.y) || new RoomPosition(best.center.x, best.center.y, room.name);
        room.visual.circle(bestCenter, { fill: 'green', radius: 0.25, stroke: 'black' });

        // add core layout to build queue
        for (let x = 0; x < layoutWidth; x++) {
            for (let y = 0; y < layoutHeight; y++) {
                const structType = this.coreLayout[x][y];
                const location = { x: best.corner.x + x, y: best.corner.y + y } as Coordinate;
                const priority = BuildQueue.getBuildPriority(structType) + this.corePriorityIncrease[x][y];
                const request = { structType, location, priority } as BuildQueueRequest;
                BuildQueue.addToBuildQueue(room, request);
            }
        }
    }

}
