import BaseColumn from "../columns/BaseColumn"
import BaseCollection from "./BaseCollection"

export default class Roles extends BaseCollection {
  __title = "Roles"

  title = new BaseColumn({
    title: "Title",
    type: "json",
  })

  // @ts-expect-error - name is overridden as BaseColumn (field) instead of string (collection name)
  name = new BaseColumn({
    title: "Name",
  })

  description = new BaseColumn({
    title: "Description",
    textarea: true,
  })

  constructor() {
    super("roles")
  }
}


