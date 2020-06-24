export class AutoBaseBuilding {
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
}
