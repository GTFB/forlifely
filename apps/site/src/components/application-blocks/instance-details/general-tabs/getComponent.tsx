import React from "react";
import { Contractors } from "./Contractors";
import { Contractor } from "@/shared/schema";

export function getComponent(collectionName: string, props: {
    instance: Contractor
}): React.ReactElement | null {
    switch (collectionName) {
        case 'contractors': 
            return <Contractors  contractor={props.instance} />
        default:
            return null
    }
}