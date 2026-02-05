import { PUBLIC_PAGES_COMPONENTS } from "@/app-public-components";
import { NotFoundClient } from "@/packages/components/pages/NotFoundClient";


export default function NotFound() {
  const _NotFoundcomponent = PUBLIC_PAGES_COMPONENTS['404'] || NotFoundClient
  return <_NotFoundcomponent/>;
}

