import BaseColumn from "../columns/BaseColumn";
import { generateAid } from "../generate-aid";
import BaseCollection from "./BaseCollection";

export default class Contractors extends BaseCollection {
    __title = 'Contractors';
    title = new BaseColumn({
        title: 'Название',
        type: 'text',
    });
    status_name = new BaseColumn({
        title: 'Статус',
        type: 'text',
        relation: {
            collection: 'taxonomy',
            valueField: 'name',
            labelField: 'title',
            filters: [{
                field: 'entity',
                op: 'eq',
                value: 'contractors.status_name',
            }],
        },
    });
    reg = new BaseColumn({
        hidden: true,
    });
    tin = new BaseColumn({
        hidden: true,
    });
    type = new BaseColumn({
        hidden: true,
    });
    city_name = new BaseColumn({
        hidden: true,
    });
    media_id = new BaseColumn({
        hidden: true,
    });
    gin = new BaseColumn({
        hidden: true,
    });
    fts = new BaseColumn({
        hidden: true,
    });
    caid = new BaseColumn({
        hidden: true,
        hooks: {
            beforeSave: (value, instance, context) => {
                if (instance.caid) {
                    return instance.caid;
                }
                instance.caid =  generateAid('c');
            },
        },
    });
}