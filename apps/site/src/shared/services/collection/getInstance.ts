import BaseCollection from "@/shared/collections/BaseCollection";
import { getCollection } from "@/shared/collections/getCollection";
import { i18n } from "../i18n";
import { getRepository } from "@/shared/repositories/getRepository";
import { eq } from "drizzle-orm";
import { parseCollectionInstance } from "./parseCollectionInstance";

export async function getInstance(collectionName: string, altrpIndex:string, locale?: string):Promise<{
    instance: any,
    collectionConfig: BaseCollection
} | null>{
    
    const collectionConfig = getCollection(collectionName)
    if(! collectionConfig){
        throw new Error(await i18n.t('collection.not_found', locale))
    }
    const collectionAltrpIndex = collectionConfig.getAltrpIndex()
    if(! collectionAltrpIndex){
        throw new Error(await i18n.t('collection.altrp_index_not_found', locale))
    }
    const repository = getRepository(collectionName, locale)
    const query = repository.getSelectQuery()
    
    let [instance] = await query
        .where(eq(repository.schema[collectionAltrpIndex], altrpIndex))
        .limit(1)
        .execute()
    instance = await parseCollectionInstance(instance, collectionConfig, locale)
    if (!instance) {
        return null
    }
    
    return {
        instance,
        collectionConfig
    }
}