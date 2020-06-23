import { RoleName } from "enums/RoleName";
import { RoleBuilder } from "./builder";
import { RoleHarvester } from "./harvester";
import { RoleUpgrader } from "./upgrader";
import { RoleContainerMiner } from "./containerMiner";
import { RoleRepairer } from "./repairer";
import { RoleTransporter } from "./transporter";
import { Role } from "./Role";

export const roleDictionary: { [name in RoleName]: Role } = {
    [RoleName.Harvester]: new RoleHarvester(),
    [RoleName.Builder]: new RoleBuilder(),
    [RoleName.Upgrader]: new RoleUpgrader(),
    [RoleName.ContainerMiner]: new RoleContainerMiner(),
    [RoleName.Transporter]: new RoleTransporter(),
    [RoleName.Repairer]: new RoleRepairer(),
};
