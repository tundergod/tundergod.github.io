import bio from "../../content/bio.json";
import conferences from "../../content/conferences.json";
import links from "../../content/links.json";
import locations from "../../content/locations.json";
import publications from "../../content/publications.json";
import researchTopics from "../../content/research-topics.json";
import travel from "../../content/travel.json";
import { validatePortfolioData } from "./portfolio-schema";

export const portfolioData = validatePortfolioData({
  bio,
  links,
  publications,
  conferences,
  locations,
  researchTopics,
  travel,
});

export type {
  Bio,
  ConferenceEdition,
  Journey,
  JourneyImage,
  Location,
  PortfolioData,
  ProfileLink,
  Publication,
  ResearchTopic,
  TravelContent,
} from "./portfolio-schema";
