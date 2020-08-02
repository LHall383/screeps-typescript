import { RoleName } from "enums/RoleName";

export class AutoBuilding {
    public static placeContainers(room: Room) {
        const sources = room.find(FIND_SOURCES);
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
