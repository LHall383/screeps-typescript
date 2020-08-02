export class AutoBuilding {
    public static placeContainers(room: Room) {
        // This could probably be improved, we never check if containers get built correctly or anything
        if (room.memory.hasPlacedContainerSites) {
            return;
        }

        const sources = room.find(FIND_SOURCES);
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length === 0) {
            return;
        }

        // Sort sources if we're doing Mark's s̶t̶u̶p̶i̶d̶  thing
        // const sortedSources = sources.sort(source => this.sortByClosestToSpawn(source.pos, spawns[0]));

        sources.forEach(source => {
            const containerSiteOptions = [];
            for (let x = -1; x < 2; x++) {
                for (let y = -1; y < 2; y++) {
                    // Skip source
                    if (x === 0 && y === 0) {
                        continue;
                    }

                    containerSiteOptions.push({
                        x: x + source.pos.x,
                        y: y + source.pos.y
                    });
                }
            }

            const validContainerSitePositions = containerSiteOptions
                .filter(siteOption => this.isValidContainerPosition(room, siteOption.x, siteOption.y))
                .map(position => new RoomPosition(position.x, position.y, room.name))
                .sort(position => this.sortByClosestToSpawn(position, spawns[0]));

            if (validContainerSitePositions.length > 0) {
                validContainerSitePositions[0].createConstructionSite(STRUCTURE_CONTAINER);
                room.memory.hasPlacedContainerSites = true;
            }
        });
    }

    private static isValidContainerPosition(room: Room, x: number, y: number) {
        const positionObjects = room.lookAt(x, y);

        let isValidPosition = true;
        positionObjects.forEach(object => {
            // Filter out walls
            if (object.type === LOOK_TERRAIN && object.terrain === "wall") {
                isValidPosition = false;
            }

            // Filter out structures that aren't roads
            if (object.type === LOOK_STRUCTURES && object.structure && object.structure.structureType !== STRUCTURE_ROAD) {
                isValidPosition = false;
            }

            // Filter out construction sites that aren't roads
            if (
                object.type === LOOK_CONSTRUCTION_SITES &&
                object.constructionSite &&
                object.constructionSite.structureType !== STRUCTURE_ROAD &&
                object.constructionSite.structureType !== STRUCTURE_CONTAINER
            ) {
                isValidPosition = false;
            }
        });

        return isValidPosition;
    }

    private static sortByClosestToSpawn(pos: RoomPosition, spawn: StructureSpawn) {
        const path = pos.findPathTo(spawn);
        return path.length;
    }

    public static placeRoads(room: Room) {

        let structLocations = room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_ROAD }
        }).map(s => [s.pos.x, s.pos.y]);


        room.find(FIND_CONSTRUCTION_SITES).map(s => [s.pos.x, s.pos.y]).forEach(t =>
            structLocations.push(t)
        );

        let spotsForRoads = [];
        let max = 0;
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                max = room.memory.locationUtilization[i][j] > max ? room.memory.locationUtilization[i][j] : max;
            }
        }

        console.log("max traversal: " + max);
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                const position = [i, j];
                if (!this.locationIn(structLocations, position)) {
                    let c = room.memory.locationUtilization[i][j];
                    if (c / max > .01) {
                        spotsForRoads.push({ x: i, y: j, count: c });
                    }
                }
            }
        }

        spotsForRoads = spotsForRoads.sort((a, b) => b.count - a.count);

        console.log(JSON.stringify(spotsForRoads));


        const maxStructuresPerCycle = 10;
        let addedStructureCount = 0;


        spotsForRoads.forEach(
            spot => {
                if (addedStructureCount < maxStructuresPerCycle) {
                    room.createConstructionSite(spot.x, spot.y, STRUCTURE_ROAD);
                    addedStructureCount++;
                    console.log("adding roads");
                }
            }
        )


    }

    private static locationIn(list: number[][], value: number[]) {
        let output = false;
        list.forEach(pair => { if (pair[0] == value[0] && pair[1] == value[1]) { output = true } });
        return output;
    }
}
