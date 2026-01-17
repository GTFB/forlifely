import BaseColumn from "../columns/BaseColumn";
import BaseCollection from "./BaseCollection";
import { SortingState } from "@tanstack/react-table";

export default class Products extends BaseCollection {
    __title = 'Products';
    status_name = new BaseColumn({
        defaultCell: ' Not Provided',
        title: 'Статус',
        relation: {
            collection: 'taxonomy',
            valueField: 'name',
            labelField: 'title',

            filters: [{
                field: 'entity',
                op: 'eq',
                value: 'products',
            }],
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
                value: 'products.categories',
            }],
        },
    });
    'data_in.price' = new BaseColumn({
        title: 'Торговая цена',
        type: 'price',
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.price || 0;
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.price = value;
            }
        },
    });
    'data_in.average_purchase_price' = new BaseColumn({
        title: 'Средняя закупочная цена с наценкой',
        type: 'price',
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.average_purchase_price || 0;
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.average_purchase_price = value;
            }
        },
    });
    'data_in.average_purchase_price_net' = new BaseColumn({
        title: 'Средняя закупочная цена',
        type: 'price',
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.average_purchase_price_net || 0;
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.average_purchase_price_net = value;
            }
        },
    });
    'data_in.reduced_limit' = new BaseColumn({
        title: 'Предел уменьшения',
        type: 'number',
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.reduced_limit || 0;
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.reduced_limit = value;
            }
        },
    });
    paid = new BaseColumn({
    });
    type = new BaseColumn({
        type: 'text',
        hidden: true,
    });
    title = new BaseColumn({
        type: 'text',
        title: 'Название',

    });
    override __defaultSort: SortingState = [{ id: 'title', desc: false }, { id: 'type', desc: true }, ] as SortingState

    'data_in.sku' = new BaseColumn({
        title: 'SKU',
        type: 'text',
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.sku || '';
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.sku = value;
            }
        },
    });

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

    'data_in.warehouse_laid' = new BaseColumn({
        title: 'Склад',
        virtual: true,
        defaultCell: 'Not Provided',
        value: async (instance: any) => {
            // Parse data_in if it's a string
            if (typeof instance.data_in === 'string') {
                try {
                    const parsed = JSON.parse(instance.data_in)
                    return parsed?.assigned_locations?.[0] || ''
                } catch {
                    return ''
                }
            }
            return instance.data_in?.warehouse_laid || ''
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                // Store as array to support multiple warehouses in the future
                instance.data_in.warehouse_laid = value
                // Note: Relations should be created via RelationsRepository after save
                // This can be done in API middleware or afterSave hook if available
            }
        },
        relation: {
            collection: 'locations',
            valueField: 'laid',
            labelField: 'title',
        },
    });
    'data_in.markup_amount' = new BaseColumn({
        title: 'Сумма наценки',
        type: 'number',
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.markup_amount || 0;
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.markup_amount = value;
            }
        },
    });
    'data_in.markup_measurement' = new BaseColumn({
        title: 'Ед. измерения наценки',
        type: 'enum',
        enum: {
            values: ['%', 'FIX'],
            labels: ['%', '₽'],
        },
        virtual: true,
        value: async (instance: any) => {
            return instance.data_in?.markup_measurement || '';
        },
        hooks: {
            beforeSave: (value: any, instance: any) => {
                if (!instance.data_in) {
                    instance.data_in = {};
                }
                instance.data_in.markup_measurement = value;
            }
        },
    });


    constructor() {
        super('products');
    }
}