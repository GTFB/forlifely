import BaseColumn from "../columns/BaseColumn";
import Base from "./BaseCollection";
import { format } from "date-fns";
import { ru, enUS, type Locale } from "date-fns/locale";

const dateLocales: Record<string, Locale> = {
    ru: ru,
    en: enUS,
};

export default class Users extends Base {
    __title = 'Пользователи';
    
    // Hide all system fields
    id = new BaseColumn({ hidden: true });
    uuid = new BaseColumn({ hidden: true });
    created_at = new BaseColumn({ hidden: true });
    updated_at = new BaseColumn({ hidden: true });
    deleted_at = new BaseColumn({ hidden: true });
    email_verified_at = new BaseColumn({ hidden: true });
    last_login_at = new BaseColumn({ hidden: true });
    hash = new BaseColumn({ hidden: true });
    salt = new BaseColumn({ hidden: true });
    
    // Hide security and authentication fields
    locked = new BaseColumn({ hidden: true });
    locked_at = new BaseColumn({ hidden: true });
    locked_until = new BaseColumn({ hidden: true });
    lock_until = new BaseColumn({ hidden: true });
    login_attempts = new BaseColumn({ hidden: true });
    last_failed_login = new BaseColumn({ hidden: true });
    reset_password_token = new BaseColumn({ hidden: true });
    reset_password_expires = new BaseColumn({ hidden: true });
    reset_password_expiration = new BaseColumn({ hidden: true });
    verification_token = new BaseColumn({ hidden: true });
    verification_expires = new BaseColumn({ hidden: true });
    remember_token = new BaseColumn({ hidden: true });
    two_factor_secret = new BaseColumn({ hidden: true });
    two_factor_enabled = new BaseColumn({ hidden: true });
    
    // Visible fields
    email = new BaseColumn({
        title: 'Email',
        type: 'email',
    });
    
    human_aid = new BaseColumn({
        title: 'Human',
        relation: {
            collection: 'humans',
            valueField: 'haid',
            labelField: 'full_name',
        },
    });
    
    'roles' = new BaseColumn({
        title: 'Роли',
        virtual: true,
        type: 'array',
        defaultCell: 'Не назначены',
        relation: {
            collection: 'roles',
            valueField: 'uuid',
            labelField: 'title',
            multiple: true,
        },
        value: async (instance: any, context?: any) => {
            // Load user roles from user_roles table
            if (!context?.env?.DB || !instance.uuid) {
                return [];
            }
            
            try {
                const { sql } = await import('drizzle-orm');
                const rolesResult = await context.env.DB.execute(
                    sql.raw(`
                        SELECT r.uuid 
                        FROM user_roles ur
                        JOIN roles r ON r.uuid = ur.role_uuid
                        WHERE ur.user_uuid = '${instance.uuid}'
                    `)
                );
                return rolesResult.map((r: any) => r.uuid);
            } catch (error) {
                console.error('Error loading user roles:', error);
                return [];
            }
        },
        hooks: {
            beforeSave: async (value: any, instance: any) => {
                // Store role UUIDs for many-to-many relationship
                instance.roleUuids = Array.isArray(value) ? value : (value ? [value] : []);
                return undefined; // Don't save to users table directly
            }
        }
    });
    
    is_active = new BaseColumn({ 
        title: 'Активность',
        type: 'boolean' 
    });
    
    password_hash = new BaseColumn({ 
        hiddenTable: true,
        title: 'Пароль',
        type: 'password',
        required: false, // Not required on edit
    });
    
    constructor() {
        super('users');
    }
}