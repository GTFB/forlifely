import React from "react";
import { type Post } from "./packages/types/post";
import { AboutClient, AboutClientProps } from "./packages/components/pages/AboutClient";
import { AdsClient } from "./packages/components/pages/AdsClient";
import { AffiliateProgramClient } from "./packages/components/pages/AffiliateProgramClient";
import { AppointmentClient } from "./packages/components/pages/AppointmentClient";
import { BlogClient } from "./packages/components/pages/BlogClient";
import { CartClient } from "./packages/components/pages/CartClient";
import { CatalogClient } from "./packages/components/pages/CatalogClient";
import { CertificatesClient } from "./packages/components/pages/CertificatesClient";
import { CheckoutClient } from "./packages/components/pages/CheckoutClient";
import { ComingSoonClient } from "./packages/components/pages/ComingSoonClient";
import { CompareClient } from "./packages/components/pages/CompareClient";
import { ContactClient } from "./packages/components/pages/ContactClient";
import { CSRClient } from "./packages/components/pages/CSRClient";
import { EmailConfirmationClient } from "./packages/components/pages/EmailConfirmationClient";
import { EventsClient } from "./packages/components/pages/EventsClient";
import { FAQClient } from "./packages/components/pages/FAQClient";
import { FranchiseClient } from "./packages/components/pages/FranchiseClient";
import { GalleryClient } from "./packages/components/pages/GalleryClient";
import { HistoryClient } from "./packages/components/pages/HistoryClient";
import { HomeClient, type HomeContent } from "./packages/components/pages/HomeClient";
import { InvestorsClient } from "./packages/components/pages/InvestorsClient";
import { JobsClient } from "./packages/components/pages/JobsClient";
import { KnowledgeBaseClient } from "./packages/components/pages/KnowledgeBaseClient";
import { LegalClient } from "./packages/components/pages/LegalClient";
import { LocationsClient } from "./packages/components/pages/LocationsClient";
import { LoyaltyProgramClient } from "./packages/components/pages/LoyaltyProgramClient";
import { MembersClient } from "./packages/components/pages/MembersClient";
import { MentorsClient } from "./packages/components/pages/MentorsClient";
import { MeetUsClient } from "./packages/components/pages/MeetUsClient";
import { NewsClient } from "./packages/components/pages/NewsClient";
import { ObjectsClient } from "./packages/components/pages/ObjectsClient";
import { PasswordRecoveryClient } from "./packages/components/pages/PasswordRecoveryClient";
import { PressClient } from "./packages/components/pages/PressClient";
import { PricesClient } from "./packages/components/pages/PricesClient";
import { ProjectsClient } from "./packages/components/pages/ProjectsClient";
import { PromotionsClient } from "./packages/components/pages/PromotionsClient";
import { SearchClient } from "./packages/components/pages/SearchClient";
import { ServicesClient } from "./packages/components/pages/ServicesClient";
import { SignInClient } from "./packages/components/pages/SignInClient";
import { SignUpClient } from "./packages/components/pages/SignUpClient";
import { SitemapClient } from "./packages/components/pages/SitemapClient";
import { SystemStatusClient } from "./packages/components/pages/SystemStatusClient";
import { TeamClient } from "./packages/components/pages/TeamClient";
import { TendersClient } from "./packages/components/pages/TendersClient";
import { TestimonialsClient } from "./packages/components/pages/TestimonialsClient";
import { ThankYouClient } from "./packages/components/pages/ThankYouClient";
import { UnderConstructionClient } from "./packages/components/pages/UnderConstructionClient";
import { UnsubscribeClient } from "./packages/components/pages/UnsubscribeClient";
import { VendorsClient } from "./packages/components/pages/VendorsClient";
import { VideoClient } from "./packages/components/pages/VideoClient";
import { WholesaleClient } from "./packages/components/pages/WholesaleClient";
import { WishlistClient } from "./packages/components/pages/WishlistClient";
import {NotFoundClient} from "./packages/components/pages/NotFoundClient";

export type PublicPageComponent = ((props?: Record<string, unknown>) => React.JSX.Element) | null | undefined;
export type PubliPagesComponent = Record<string, PublicPageComponent>;

export const PUBLIC_PAGES_COMPONENTS: PubliPagesComponent = {
  about: (props) => <AboutClient {...(props as unknown as AboutClientProps)} />,
  home: (props) => <HomeClient homeContent={(props as { homeContent: HomeContent }).homeContent} />,
  ads: (props) => <AdsClient {...(props as { title: string; description: string })} />,
  "affiliate-program": (props) => <AffiliateProgramClient {...(props as { title: string; description: string })} />,
  appointment: (props) => <AppointmentClient {...(props as { title: string; description: string })} />,
  blog: (props) => <BlogClient {...(props as { title: string; description?: string; blogPosts: Post[] })} />,
  cart: (props) => <CartClient {...(props as { title: string; description: string })} />,
  catalog: (props) => <CatalogClient {...(props as { title: string; description: string })} />,
  certificates: (props) => <CertificatesClient {...(props as { title: string; description: string })} />,
  checkout: (props) => <CheckoutClient {...(props as { title: string; description: string })} />,
  "coming-soon": (props) => <ComingSoonClient {...(props as { title: string; description: string })} />,
  compare: (props) => <CompareClient {...(props as { title: string; description: string })} />,
  contact: (props) => <ContactClient {...(props as { title: string; description: string })} />,
  csr: (props) => <CSRClient {...(props as { title: string; description: string })} />,
  "email-confirmation": (props) => <EmailConfirmationClient {...(props as { title: string; description: string })} />,
  events: (props) => <EventsClient {...(props as { title: string; description: string })} />,
  faq: (props) => <FAQClient {...(props as { title: string; faq: { question: string; answer: string }[] })} />,
  franchise: (props) => <FranchiseClient {...(props as { title: string; description: string })} />,
  gallery: (props) => <GalleryClient {...(props as { title: string; description: string })} />,
  history: (props) => <HistoryClient {...(props as { title: string; description: string })} />,
  investors: (props) => <InvestorsClient {...(props as { title: string; description: string })} />,
  jobs: (props) => <JobsClient {...(props as { title: string; description: string })} />,
  "knowledge-base": (props) => <KnowledgeBaseClient {...(props as { title: string; description: string })} />,
  legal: (props) => <LegalClient {...(props as { title: string; description: string })} />,
  locations: (props) => <LocationsClient {...(props as { title: string; description: string })} />,
  "loyalty-program": (props) => <LoyaltyProgramClient {...(props as { title: string; description: string })} />,
  members: (props) => <MembersClient {...(props as { title: string; description?: string; hero?: unknown; feature62?: unknown; feature170?: unknown; feature183?: unknown })} />,
  mentors: (props) => <MentorsClient {...(props as { title: string; description?: string; hero?: unknown; feature62?: unknown; feature170?: unknown; feature183?: unknown })} />,
  "meet-us": (props) => <MeetUsClient {...(props as { title: string; description?: string })} />,
  news: (props) => <NewsClient {...(props as { title: string; description: string })} />,
  objects: (props) => <ObjectsClient {...(props as { title: string; description: string })} />,
  "password-recovery": (props) => <PasswordRecoveryClient {...(props as { title: string; description: string })} />,
  press: (props) => <PressClient {...(props as { title: string; description: string })} />,
  prices: (props) => <PricesClient {...(props as { title: string; description: string })} />,
  projects: (props) => <ProjectsClient {...(props as { title: string; description: string })} />,
  promotions: (props) => <PromotionsClient {...(props as { title: string; description: string })} />,
  search: (props) => <SearchClient {...(props as { title: string; description: string })} />,
  services: (props) => <ServicesClient {...(props as { title: string; description: string })} />,
  "sign-in": (props) => <SignInClient {...(props as { title: string; description: string })} />,
  "sign-up": (props) => <SignUpClient {...(props as { title: string; description: string })} />,
  sitemap: (props) => <SitemapClient {...(props as { title: string; description: string })} />,
  "system-status": (props) => <SystemStatusClient {...(props as { title: string; description: string })} />,
  team: (props) => <TeamClient {...(props as { title: string; description: string })} />,
  tenders: (props) => <TendersClient {...(props as { title: string; description: string })} />,
  testimonials: (props) => <TestimonialsClient {...(props as { title: string; description: string })} />,
  "thank-you": (props) => <ThankYouClient {...(props as { title: string; description: string })} />,
  "under-construction": (props) => <UnderConstructionClient {...(props as { title: string; description: string })} />,
  unsubscribe: (props) => <UnsubscribeClient {...(props as { title: string; description: string })} />,
  vendors: (props) => <VendorsClient {...(props as { title: string; description: string })} />,
  video: (props) => <VideoClient {...(props as { title: string; description: string })} />,
  wholesale: (props) => <WholesaleClient {...(props as { title: string; description: string })} />,
  wishlist: (props) => <WishlistClient {...(props as { title: string; description: string })} />,
  '404': (props) => <NotFoundClient {...props as any}/>
};
