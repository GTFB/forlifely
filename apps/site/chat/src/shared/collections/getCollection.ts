import BaseCollection from "./BaseCollection";
import Users from "./users";
import UserRoles from "./user_roles";
import Humans from "./humans";
import Employees from "./employees";
import Locations from "./locations";
import Products from "./products";
import Contractors from "./contractors";
import Relations from "./relations";
import BaseMoves from "./base_moves";
import Texts from "./texts";
import Deals from "./deals";
import DealsProducts from "./deals_products";
import Taxonomy from "./taxonomy";

const collections: Record<string, BaseCollection> = {
    base: new BaseCollection('base'),
    users: new Users(),
    user_roles: new UserRoles(),
    humans: new Humans(),
    employees: new Employees(),
    locations: new Locations(),
    products: new Products(),
    contractors: new Contractors(), 
    relations: new Relations(),
    base_moves: new BaseMoves(),
    texts: new Texts(),
    deals: new Deals(),
    deal_products: new DealsProducts(),
    taxonomy: new Taxonomy(),
}

export const getCollection = (collection: string): BaseCollection => {
    return collections[collection] || collections.base;
}
