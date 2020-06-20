import { RoleName } from "enums/RoleName";
import { RoleBuilder } from "roles/builder";
import { RoleHarvester } from "roles/harvester";
import { Role } from "roles/Role";

export class RoleMapper {
    public static mapEnumToClass = (role: RoleName): Role | undefined => {
        switch (role) {
            case RoleName.Harvester:
                return RoleHarvester;
            case RoleName.Builder:
                return RoleBuilder;
            default:
                console.error("No role mapping defined, did you add your role to this mapper?");
                return undefined;
        }
    };
}
