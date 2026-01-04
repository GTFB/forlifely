import BaseCollection from "./BaseCollection";
import Users from "./users";
import UserRoles from "./user_roles";
import Humans from "./humans";
import Roles from "./roles";

const collections: Record<string, BaseCollection> = {
    base: new BaseCollection('base'),
    users: new Users(),
    user_roles: new UserRoles(),
    humans: new Humans(),
    roles: new Roles() as unknown as BaseCollection, // Roles overrides name as BaseColumn, but collection name is still accessible via constructor
}

export const getCollection = (collection: string): BaseCollection => {
    return collections[collection] || collections.base;
}
