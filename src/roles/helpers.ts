export class RoleHelpers {
    public static filterMainRepairs(s: AnyStructure): boolean {
        return (s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_SPAWN ||
            s.structureType === STRUCTURE_TOWER ||
            s.structureType === STRUCTURE_LAB ||
            s.structureType === STRUCTURE_STORAGE ||
            s.structureType === STRUCTURE_NUKER ||
            s.structureType === STRUCTURE_TERMINAL ||
            s.structureType === STRUCTURE_OBSERVER ||
            s.structureType === STRUCTURE_PORTAL ||
            s.structureType === STRUCTURE_POWER_BANK ||
            s.structureType === STRUCTURE_POWER_SPAWN ||
            s.structureType === STRUCTURE_EXTRACTOR ||
            s.structureType === STRUCTURE_FACTORY ||
            s.structureType === STRUCTURE_LINK ||
            s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax;
    }

    public static getBestHarvestSource(creep: Creep, sources: Source[]): Source {
        const sorted = _.sortBy(sources, source => {
            const openSpots = source.pos.availableNeighbors().length;
            if (source.targetedBy.length >= openSpots) {
                return Infinity;
            }
            return creep.pos.getRangeTo(source) * (1 + source.targetedBy.length);
        });
        return sorted[0];
    }
}
