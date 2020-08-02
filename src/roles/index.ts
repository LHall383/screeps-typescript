import { RoleName } from "enums/RoleName";
import { Role } from "./Role";
import { RoleBuilder } from "./RoleInstances/builder";
import { RoleContainerMiner } from "./RoleInstances/containerMiner";
import { RoleHarvester } from "./RoleInstances/harvester";
import { RoleRepairer } from "./RoleInstances/repairer";
import { RoleTransporter } from "./RoleInstances/transporter";
import { RoleUpgrader } from "./RoleInstances/upgrader";

export const roleDictionary: { [name in RoleName]: Role } = {
    [RoleName.Harvester]: new RoleHarvester(),
    [RoleName.Builder]: new RoleBuilder(),
    [RoleName.Upgrader]: new RoleUpgrader(),
    [RoleName.ContainerMiner]: new RoleContainerMiner(),
    [RoleName.Transporter]: new RoleTransporter(),
    [RoleName.Repairer]: new RoleRepairer()
};
