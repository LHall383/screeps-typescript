import { RoleName } from "enums/RoleName";
import { RoleBuilder } from "./builder";
import { RoleHarvester } from "./harvester";
import { Role } from "./Role";

export const roleDictionary: { [name in RoleName]: Role } = {
    [RoleName.Harvester]: new RoleHarvester(),
    [RoleName.Builder]: new RoleBuilder()
};
