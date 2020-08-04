import { BuildQueue } from "./build_queue";
import { CANCELLED } from "dns";

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
                const pos = checkRoom.getPositionAt(checkX, checkY) || new RoomPosition(checkX, checkY, checkRoom.name);

                // Can't build on walls
                if (terrain.get(checkX, checkY) === TERRAIN_MASK_WALL) {
                    return false;
                }

                // Don't want to build directly next to a source
                if ((sources[0] && pos.isNearTo(sources[0]))
                    || (sources[1] && pos.isNearTo(sources[1]))) {
                    return false;
                }

                // Don't plan this if there are build queue entries at this location
                const entries = BuildQueue.getEntriesAtLocation(checkRoom, checkX, checkY);
                if (entries.length > 0) {
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
        room.memory.basePlan = room.memory.basePlan || { hasPlannedExtensions: false } as { corner: Coordinate; center: Coordinate; labCorner: Coordinate; hasPlannedExtensions: boolean; };
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
                const structType = this.coreLayout[y][x];
                const location = { x: best.corner.x + x, y: best.corner.y + y } as Coordinate;
                const priority = BuildQueue.getBuildPriority(structType) + this.corePriorityIncrease[y][x];
                const request = { structType, location, priority } as BuildQueueRequest;
                BuildQueue.addToBuildQueue(room, request);
            }
        }
    }

    /* Calculate a fitness score for a lab setup centered at the provided position, lower score is better */
    private static calcLabFitness(room: Room, center: RoomPosition, terminalPos: RoomPosition | undefined): number {
        let score = 0;

        // Prefer locations that are further from exits
        const closestExit = center.findClosestByRange(FIND_EXIT);
        if (closestExit) {
            const rangeFromExit = center.getRangeTo(closestExit);
            score -= rangeFromExit;
        }

        // Prefer locations that are closer to the terminal
        if (terminalPos) {
            const pathToTerminal = center.findPathTo(terminalPos);
            const pathBelowTerminal = center.findPathTo(new RoomPosition(terminalPos.x, terminalPos.y + 1, room.name));
            score = score += pathToTerminal.length;
            score = score += pathBelowTerminal.length;
        }

        return score;
    }

    /* Find a place for the fixed lab layout and enter into build queue */
    public static planLabLayout(room: Room) {
        // check if this room has already been planned for, if so, exit early
        room.memory.basePlan = room.memory.basePlan || { hasPlannedExtensions: false } as { corner: Coordinate; center: Coordinate; labCorner: Coordinate; hasPlannedExtensions: boolean; };
        if (room.memory.basePlan.labCorner) {
            return;
        }

        // read some properties from the lab layout
        const layoutWidth = this.labLayout[0].length;
        const layoutHeight = this.labLayout.length;

        // if the main layout is placed, check if we can place the labs below, if so, do that
        let best;
        if (room.memory.basePlan.corner) {
            const prefCornerX = room.memory.basePlan.corner.x + 1;
            const prefCornerY = room.memory.basePlan.corner.y + 7;
            const prefPos = room.getPositionAt(prefCornerX, prefCornerY) || new RoomPosition(prefCornerX, prefCornerY, room.name);

            const canPlace = this.canPlaceLayout(this.labLayout, layoutWidth, layoutHeight, prefPos, room);
            if (canPlace) {
                best = { corner: { x: prefCornerX, y: prefCornerY } };
            }
        }

        if (!best) {
            // search through every possible location in the room
            const possibleLocations = [] as Array<{ corner: Coordinate; center: Coordinate; score: number }>;

            // find the terminal for this room
            let terminalPos;
            const terminalReq = BuildQueue.getEntriesOfType(room, STRUCTURE_TERMINAL);
            if (room.terminal) {
                terminalPos = room.terminal.pos;
            } else if (terminalReq.length > 0) {
                terminalPos = room.getPositionAt(terminalReq[0].location.x, terminalReq[0].location.y) || new RoomPosition(terminalReq[0].location.x, terminalReq[0].location.y, room.name);
            }

            for (let x = 1; x < 49 - layoutWidth; x++) {
                for (let y = 1; y < 49 - layoutHeight; y++) {
                    // get associated room position object
                    const pos = room.getPositionAt(x, y) || new RoomPosition(x, y, room.name);

                    // check if layout can be placed
                    const canPlace = this.canPlaceLayout(this.labLayout, layoutWidth, layoutHeight, pos, room);

                    // get a score for this lab location
                    if (canPlace) {
                        const centerX = Math.floor(x + layoutWidth / 2);
                        const centerY = Math.floor(y + layoutHeight / 2);
                        const baseCenter = room.getPositionAt(centerX, centerY) || new RoomPosition(centerX, centerY, room.name);
                        const score = this.calcLabFitness(room, baseCenter, terminalPos);

                        possibleLocations.push({
                            corner: { x, y },
                            center: { x: centerX, y: centerY },
                            score
                        } as { corner: Coordinate; center: Coordinate, score: number });
                    }
                }
            }

            // pick best lab location
            const sortedLocations = _.sortBy(possibleLocations, location => location.score)
            best = sortedLocations[0];
        }

        // set memory flag
        room.memory.basePlan.labCorner = best.corner;

        // add lab layout to build queue
        for (let x = 0; x < layoutWidth; x++) {
            for (let y = 0; y < layoutHeight; y++) {
                const structType = this.labLayout[y][x];
                const location = { x: best.corner.x + x, y: best.corner.y + y } as Coordinate;
                const priority = BuildQueue.getBuildPriority(structType) + this.labPriorityIncrease[y][x];
                const request = { structType, location, priority } as BuildQueueRequest;
                BuildQueue.addToBuildQueue(room, request);
            }
        }
    }

    /* Plan extension placement for the base */
    public static planExtensions(room: Room) {
        // check if a base plan exists, exit if not
        room.memory.basePlan = room.memory.basePlan || { hasPlannedExtensions: false } as { corner: Coordinate; center: Coordinate; labCorner: Coordinate; hasPlannedExtensions: boolean; };
        if (!room.memory.basePlan.center) {
            return;
        }
        const center = room.getPositionAt(room.memory.basePlan.center.x, room.memory.basePlan.center.y) || new RoomPosition(room.memory.basePlan.center.x, room.memory.basePlan.center.y, room.name);

        // check if extensions have been planned, if so, exit
        if (room.memory.basePlan.hasPlannedExtensions) {
            return;
        }

        // Get terrain map
        const terrain = room.getTerrain();

        // Locate sources
        const sources = room.find(FIND_SOURCES);

        // find all possible locations for extensions, and give them each a score, then order by score
        const possibleExtensions = [];
        for (let y = room.memory.basePlan.center.y % 2; y < 49; y++) {
            for (let x = (room.memory.basePlan.center.x % 2) + (1 - (y % 2)); x < 49; x += 2) {
                // Can't build on walls
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
                    continue;
                }

                // Don't want to build too close to a source
                if ((sources[0] && sources[0].pos.inRangeTo(x, y, 3))
                    || (sources[1] && sources[1].pos.inRangeTo(x, y, 3))) {
                    continue;
                }

                // Don't want to build too close to the controller
                if (room.controller && room.controller.pos.inRangeTo(x, y, 3)) {
                    continue;
                }

                // Don't plan this if there are build queue entries at this location
                const entries = BuildQueue.getEntriesAtLocation(room, x, y);
                if (entries.length > 0) {
                    continue;
                }

                // If location is not obstructed, calculate a score for this location
                let dist = 0;
                if (sources.length > 0) { dist += sources[0].pos.findPathTo(x, y, { plainCost: 1, swampCost: 1, ignoreCreeps: true }).length; }
                if (sources.length > 1) { dist += sources[1].pos.findPathTo(x, y, { plainCost: 1, swampCost: 1, ignoreCreeps: true }).length; }
                dist *= .35;
                dist += center.findPathTo(x, y, { plainCost: 1, swampCost: 1, ignoreCreeps: true }).length;
                possibleExtensions.push({ x, y, score: dist });
            }
        }
        possibleExtensions.sort((a, b) => a.score - b.score);

        // push those with the highest scores to the build queue
        for (let i = 0; i < possibleExtensions.length && i < 59; i++) {
            const location = { x: possibleExtensions[i].x, y: possibleExtensions[i].y } as Coordinate;
            const request = { structType: STRUCTURE_EXTENSION, priority: BuildQueue.getBuildPriority(STRUCTURE_EXTENSION) + i, location } as BuildQueueRequest;
            BuildQueue.addToBuildQueue(room, request);
        }

        room.memory.basePlan.hasPlannedExtensions = true;
    }

}
