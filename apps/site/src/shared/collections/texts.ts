import BaseColumn from "../columns/BaseColumn";
import BaseCollection from "./BaseCollection";
import { generateAid } from "../generate-aid";

export default class Texts extends BaseCollection {
    __title = 'Отчеты';
    title = new BaseColumn({
        type: 'text',
        title: 'Название',
    });
    type = new BaseColumn({
        title: 'Тип',
        relation: {
            collection: 'taxonomy',
            valueField: 'name',
            labelField: 'title',
            filters: [{
                field: 'entity',
                op: 'eq',
                value: 'texts',
            }],
        },
    });
    status_name = new BaseColumn({
        title: 'Статус',
        relation: {
            collection: 'taxonomy',
            valueField: 'name',
            labelField: 'title',
            filters: [
                {
                    field: 'entity',
                    op: 'eq',
                    value: 'texts',
                },
            ],
        },
    });
    is_public = new BaseColumn({    
        title: 'Публичный',
        type: 'boolean',
        hiddenTable: true,
    });
    content = new BaseColumn({
        type: 'text',
        title: 'Контент',
        defaultCell: 'не заполнено',
        fieldType: 'tiptap',
        hiddenTable: true, // Hide from table, show only in edit form
    });
    'dataIn.images' = new BaseColumn({
        title: 'Изображения',
        type: 'json',
        virtual: true,
        hiddenTable: true, // Hide from table, show only in edit form
        value: async (instance: any) => {
            let dataIn: any = null;
            
            // Handle both string and object formats
            if (typeof instance.data_in === 'string') {
                try {
                    // Try to parse JSON string (may be double-encoded)
                    let parsed = JSON.parse(instance.data_in);
                    // If result is still a string, parse again (double-encoded case)
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch {
                            // If second parse fails, use first parse result
                        }
                    }
                    dataIn = parsed;
                } catch {
                    // If parsing fails, try to treat as plain string
                    try {
                        dataIn = JSON.parse(instance.data_in);
                    } catch {
                        return [];
                    }
                }
            } else if (instance.data_in && typeof instance.data_in === 'object') {
                dataIn = instance.data_in;
            } else {
                return [];
            }
            
            // Support both old 'image' (single) and new 'images' (array) format
            if (dataIn?.images && Array.isArray(dataIn.images)) {
                return dataIn.images;
            }
            // Migrate old single image to array
            if (dataIn?.image) {
                return Array.isArray(dataIn.image) ? dataIn.image : [dataIn.image];
            }
            return [];
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                // Ensure value is an array
                instance.dataIn.images = Array.isArray(value) ? value : (value ? [value] : []);
            }
        },
    });
    gin = new BaseColumn({
        type: 'json',
        hidden: true,
    });
    fts = new BaseColumn({
        type: 'text',
        hidden: true,
    });
    data_in = new BaseColumn({
        type: 'json',
        hidden: true,
    });
    constructor() {
        super('texts');
    }
}