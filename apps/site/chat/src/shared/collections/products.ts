import BaseColumn from "../columns/BaseColumn";
import BaseCollection from "./BaseCollection";

export default class Products extends BaseCollection {
    __title = 'Продукты';
    title = new BaseColumn({
        type: 'json',
        hidden: true,
    });
    'title.ru' = new BaseColumn({
        type: 'text',
        title: 'Название',
        virtual: true,
        value: async (instance: any) => {
            return instance.title?.ru || '';
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.title) {
                    instance.title = {};
                }
                if(typeof instance.title === 'string') {
                    instance.title = {
                        ru: value,
                    }       
                }
                else {
                    instance.title.ru = value;
                }
            }
        },
    });
    status_name = new BaseColumn({
        defaultCell: ' Not Provided',
        title: 'Статус',
        relation: {
            collection: 'taxonomy',
            valueField: 'name',
            labelField: 'title',

            filters: [
                {
                    field: 'entity',
                    op: 'eq',
                    value: 'products',
                },
                {
                    field: 'name',
                    op: 'in',
                    value: ['PUBLISHED', 'DRAFT', 'ARCHIEVED'],
                },
            ],
        },
    });
    category = new BaseColumn({
        title: 'Категория',
        relation: {
            collection: 'taxonomy',
            valueField: 'name',
            labelField: 'title',
            filters: [{
                field: 'entity',
                op: 'eq',
                value: 'category',
            }],
        },
    });
    'dataIn.price' = new BaseColumn({
        title: 'Цена',
        type: 'price',
        virtual: true,
        value: async (instance: any) => {
            if(typeof instance.data_in === 'string') {
                try {
                    const parsed = JSON.parse(instance.data_in)
                    return parsed?.price || 0;
                } catch {
                    return 0;
                }
            }

            return instance.data_in?.price || 0;
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                instance.dataIn.price = value;
            }
        },
    });
    'dataIn.weight' = new BaseColumn({
        title: 'Граммовка',
        type: 'text',
        virtual: true,
        value: async (instance: any) => {
            if(typeof instance.data_in === 'string') {
                try {
                    const parsed = JSON.parse(instance.data_in)
                    return parsed?.weight ? String(parsed.weight) : '';
                } catch {
                    return '';
                }
            }

            return instance.data_in?.weight ? String(instance.data_in.weight) : '';
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                instance.dataIn.weight = value;
            }
        },
    });
    'dataIn.description' = new BaseColumn({
        title: 'Описание',
        type: 'text',
        fieldType: 'tiptap',
        virtual: true,
        value: async (instance: any) => {
            if(typeof instance.data_in === 'string') {
                try {
                    const parsed = JSON.parse(instance.data_in)
                    return parsed?.description || '';
                } catch {
                    return '';
                }
            }

            return instance.data_in?.description || '';
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                instance.dataIn.description = value;
            }
        },
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
    'dataIn.attributes' = new BaseColumn({
        title: 'Атрибуты',
        type: 'json',
        virtual: true,
        hiddenTable: true,
        value: async (instance: any) => {
            let dataIn: any = null;
            
            if (typeof instance.data_in === 'string') {
                try {
                    let parsed = JSON.parse(instance.data_in);
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch {
                            // If second parse fails, use first parse result
                        }
                    }
                    dataIn = parsed;
                } catch {
                    try {
                        dataIn = JSON.parse(instance.data_in);
                    } catch {
                        return {};
                    }
                }
            } else if (instance.data_in && typeof instance.data_in === 'object') {
                dataIn = instance.data_in;
            } else {
                return {};
            }
            
            return dataIn?.attributes || {};
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                instance.dataIn.attributes = value || {};
            }
        },
    });
    'dataIn.attributes.country' = new BaseColumn({
        title: 'Страна',
        type: 'json',
        virtual: true,
        value: async (instance: any) => {
            let dataIn: any = null;
            
            if (typeof instance.data_in === 'string') {
                try {
                    let parsed = JSON.parse(instance.data_in);
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch {}
                    }
                    dataIn = parsed;
                } catch {
                    try {
                        dataIn = JSON.parse(instance.data_in);
                    } catch {
                        return {};
                    }
                }
            } else if (instance.data_in && typeof instance.data_in === 'object') {
                dataIn = instance.data_in;
            } else {
                return {};
            }
            
            const country = dataIn?.attributes?.country;
            // Support both old string format and new object format
            if (typeof country === 'string') {
                return { ru: country, en: country };
            }
            return country || {};
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                if (!instance.dataIn.attributes) {
                    instance.dataIn.attributes = {};
                }
                // If value is a string, convert to object
                if (typeof value === 'string') {
                    instance.dataIn.attributes.country = { ru: value, en: value };
                } else {
                    instance.dataIn.attributes.country = value || {};
                }
            }
        },
    });
    'dataIn.attributes.length' = new BaseColumn({
        title: 'Длина',
        type: 'json',
        virtual: true,
        value: async (instance: any) => {
            let dataIn: any = null;
            
            if (typeof instance.data_in === 'string') {
                try {
                    let parsed = JSON.parse(instance.data_in);
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch {}
                    }
                    dataIn = parsed;
                } catch {
                    try {
                        dataIn = JSON.parse(instance.data_in);
                    } catch {
                        return {};
                    }
                }
            } else if (instance.data_in && typeof instance.data_in === 'object') {
                dataIn = instance.data_in;
            } else {
                return {};
            }
            
            const length = dataIn?.attributes?.length;
            // Support both old string format and new object format
            if (typeof length === 'string') {
                return { ru: length, en: length };
            }
            return length || {};
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                if (!instance.dataIn.attributes) {
                    instance.dataIn.attributes = {};
                }
                // If value is a string, convert to object
                if (typeof value === 'string') {
                    instance.dataIn.attributes.length = { ru: value, en: value };
                } else {
                    instance.dataIn.attributes.length = value || {};
                }
            }
        },
    });
    'dataIn.attributes.weight' = new BaseColumn({
        title: 'Вес (атрибут)',
        type: 'json',
        virtual: true,
        value: async (instance: any) => {
            let dataIn: any = null;
            
            if (typeof instance.data_in === 'string') {
                try {
                    let parsed = JSON.parse(instance.data_in);
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch {}
                    }
                    dataIn = parsed;
                } catch {
                    try {
                        dataIn = JSON.parse(instance.data_in);
                    } catch {
                        return {};
                    }
                }
            } else if (instance.data_in && typeof instance.data_in === 'object') {
                dataIn = instance.data_in;
            } else {
                return {};
            }
            
            const weight = dataIn?.attributes?.weight;
            // Support both old string format and new object format
            if (typeof weight === 'string') {
                return { ru: weight, en: weight };
            }
            return weight || {};
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                if (!instance.dataIn.attributes) {
                    instance.dataIn.attributes = {};
                }
                // If value is a string, convert to object
                if (typeof value === 'string') {
                    instance.dataIn.attributes.weight = { ru: value, en: value };
                } else {
                    instance.dataIn.attributes.weight = value || {};
                }
            }
        },
    });
    'dataIn.attributes.vbn' = new BaseColumn({
        title: 'ВБН',
        type: 'json',
        virtual: true,
        value: async (instance: any) => {
            let dataIn: any = null;
            
            if (typeof instance.data_in === 'string') {
                try {
                    let parsed = JSON.parse(instance.data_in);
                    if (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch {}
                    }
                    dataIn = parsed;
                } catch {
                    try {
                        dataIn = JSON.parse(instance.data_in);
                    } catch {
                        return {};
                    }
                }
            } else if (instance.data_in && typeof instance.data_in === 'object') {
                dataIn = instance.data_in;
            } else {
                return {};
            }
            
            const vbn = dataIn?.attributes?.vbn;
            // Support both old string format and new object format
            if (typeof vbn === 'string') {
                return { ru: vbn, en: vbn };
            }
            return vbn || {};
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.dataIn) {
                    instance.dataIn = {};
                }
                if (!instance.dataIn.attributes) {
                    instance.dataIn.attributes = {};
                }
                // If value is a string, convert to object
                if (typeof value === 'string') {
                    instance.dataIn.attributes.vbn = { ru: value, en: value };
                } else {
                    instance.dataIn.attributes.vbn = value || {};
                }
            }
        },
    });
    // 'data_in.average_purchase_price' = new BaseColumn({
    //     title: 'Средняя закупочная цена с наценкой',
    //     type: 'price',
    //     virtual: true,
    //     value: async (instance: any) => {
    //         return instance.data_in?.average_purchase_price || 0;
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             instance.data_in.average_purchase_price = value;
    //         }
    //     },
    // });
    // 'data_in.average_purchase_price_net' = new BaseColumn({
    //     title: 'Средняя закупочная цена',
    //     type: 'price',
    //     virtual: true,
    //     value: async (instance: any) => {
    //         return instance.data_in?.average_purchase_price_net || 0;
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             instance.data_in.average_purchase_price_net = value;
    //         }
    //     },
    // });
    // 'data_in.reduced_limit' = new BaseColumn({
    //     title: 'Предел уменьшения',
    //     type: 'number',
    //     virtual: true,
    //     value: async (instance: any) => {
    //         return instance.data_in?.reduced_limit || 0;
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             instance.data_in.reduced_limit = value;
    //         }
    //     },
    // });
    paid = new BaseColumn({
        title: 'Paid',
    });
    type = new BaseColumn({
        type: 'text',
        hidden: true,
    });
    // 'data_in.sku' = new BaseColumn({
    //     title: 'SKU',
    //     type: 'text',
    //     virtual: true,
    //     value: async (instance: any) => {
    //         return instance.data_in?.sku || '';
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             instance.data_in.sku = value;
    //         }
    //     },
    // });

    is_public = new BaseColumn({
        hidden: true,
    });
    gin = new BaseColumn({
        type: 'json',
        hidden: true,
    });
    fts = new BaseColumn({
        type: 'text',
        hidden: true,
    });

    // 'data_in.warehouse_laid' = new BaseColumn({
    //     title: 'Склад',
    //     virtual: true,
    //     defaultCell: 'Not Provided',
    //     value: async (instance: any) => {
    //         // Parse data_in if it's a string
    //         if (typeof instance.data_in === 'string') {
    //             try {
    //                 const parsed = JSON.parse(instance.data_in)
    //                 return parsed?.assigned_locations?.[0] || ''
    //             } catch {
    //                 return ''
    //             }
    //         }
    //         return instance.data_in?.warehouse_laid || ''
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             // Store as array to support multiple warehouses in the future
    //             instance.data_in.warehouse_laid = value
    //             // Note: Relations should be created via RelationsRepository after save
    //             // This can be done in API middleware or afterSave hook if available
    //         }
    //     },
    //     relation: {
    //         collection: 'locations',
    //         valueField: 'laid',
    //         labelField: 'title',
    //     },
    // });
    // 'data_in.markup_amount' = new BaseColumn({
    //     title: 'Сумма наценки',
    //     type: 'number',
    //     virtual: true,
    //     value: async (instance: any) => {
    //         return instance.data_in?.markup_amount || 0;
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             instance.data_in.markup_amount = value;
    //         }
    //     },
    // });
    // 'data_in.markup_measurement' = new BaseColumn({
    //     title: 'Ед. измерения наценки',
    //     type: 'enum',
    //     enum: {
    //         values: ['%', 'FIX'],
    //         labels: ['%', '₽'],
    //     },
    //     virtual: true,
    //     value: async (instance: any) => {
    //         return instance.data_in?.markup_measurement || '';
    //     },
    //     hooks: {
    //         beforeSave: (value: any, instance: any) => {
    //             if (!instance.data_in) {
    //                 instance.data_in = {};
    //             }
    //             instance.data_in.markup_measurement = value;
    //         }
    //     },
    // });


    constructor() {
        super('products');
    }
}