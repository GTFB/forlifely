import React from "react";
import { Contractors } from "./Contractors";
import { Contractor } from "@/shared/schema";

export function GeneralTabFactory({collectionName,instance}:{collectionName : string, instance: Contractor}) {
    switch (collectionName) {
        case 'contractors': 
            return <Contractors  contractor={instance} />
        default:
            return null
    }
}