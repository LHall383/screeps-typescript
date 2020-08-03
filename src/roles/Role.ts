export abstract class Role {
    public static roleName: string;
    public abstract newTask(creep: Creep): boolean;
}
