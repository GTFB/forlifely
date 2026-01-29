import BaseColumn from "../columns/BaseColumn";
import BaseCollection from "./BaseCollection";

export default class Taxonomy extends BaseCollection {
    __title = 'Таксономия';
    entity = new BaseColumn({
        type: 'enum',
        title: 'Сущность',
        enum: {
            values: [
                'products',
                'category',
                'texts',
                'base_moves',
                'wallet_transactions',
                'contractors.status_name',
                'relations.MOVE_ITEM',
                'product_attributes',
            ],
            labels: [
                'Продукты',
                'Категория',
                'Новости',
                'Машины',
                'Транзакции кошелька',
                'Статус контрагентов',
                'Тип движения товара',
                'Атрибуты товаров',
            ],
        },
    });
    name = new BaseColumn({
        type: 'text',
        title: 'Имя',
    }) as any; // Override BaseCollection.name (string) with BaseColumn
    title = new BaseColumn({
        type: 'text',
        title: 'Название',
    });
    sort_order = new BaseColumn({
        type: 'number',
        title: 'Порядок сортировки',
    });
    constructor() {
        super('taxonomy');
    }
}

