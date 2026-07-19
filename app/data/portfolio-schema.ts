export type ProfileLink = {
  id: string;
  label: string;
  url: string;
  placement: "header" | "footer";
};

export type Bio = {
  name: string;
  monogram: string;
  role: string;
  affiliation: string;
  affiliationCountry: string;
  location: string;
  biography: string;
  seoTitle: string;
  seoDescription: string;
};

export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: "journal" | "conference";
  venueTags: string[];
  venueLong: string;
  doi: string | null;
  topics: string[];
  conferenceEditionId: string | null;
};

export type ConferenceEdition = {
  id: string;
  series: string;
  name: string;
  year: number;
  dates: string;
  placeId: string;
};

export type Location = {
  id: string;
  city: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type ResearchTopic = {
  id: string;
  label: string;
  description?: string;
};

export type JourneyImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type Journey = {
  id: string;
  conferenceEditionId: string;
  publicationIds?: string[];
  images: JourneyImage[];
};

export type TravelContent = {
  placeholder: { title: string; body: string };
  journeys: Journey[];
};

export type PortfolioData = {
  bio: Bio;
  links: ProfileLink[];
  publications: Publication[];
  conferences: ConferenceEdition[];
  locations: Location[];
  researchTopics: ResearchTopic[];
  travel: TravelContent;
};

export class ContentValidationError extends Error {
  override name = "ContentValidationError";
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(
  value: unknown,
  label: string,
  problems: string[],
): UnknownRecord {
  if (isRecord(value)) return value;
  problems.push(`${label}: expected an object`);
  return {};
}

function assertExactKeys(
  value: UnknownRecord,
  allowedKeys: readonly string[],
  label: string,
  problems: string[],
) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      problems.push(`${label}: unknown field "${key}"`);
    }
  }
}

function readString(
  value: unknown,
  label: string,
  problems: string[],
): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  problems.push(`${label}: expected a non-empty string`);
  return "";
}

function readOptionalString(
  value: unknown,
  label: string,
  problems: string[],
): string | undefined {
  if (value === undefined) return undefined;
  return readString(value, label, problems);
}

function readNumber(
  value: unknown,
  label: string,
  problems: string[],
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  problems.push(`${label}: expected a finite number`);
  return 0;
}

function readArray(
  value: unknown,
  label: string,
  problems: string[],
): unknown[] {
  if (Array.isArray(value)) return value;
  problems.push(`${label}: expected an array`);
  return [];
}

function readStringArray(
  value: unknown,
  label: string,
  problems: string[],
  allowEmpty = false,
): string[] {
  const values = readArray(value, label, problems).map((item, index) =>
    readString(item, `${label}[${index}]`, problems),
  );
  if (!allowEmpty && values.length === 0) {
    problems.push(`${label}: expected at least one item`);
  }
  return values;
}

function recordLabel(kind: string, value: UnknownRecord, index: number) {
  return typeof value.id === "string" && value.id.length > 0
    ? `${kind} "${value.id}"`
    : `${kind}[${index}]`;
}

function assertUniqueIds(
  records: Array<{ id: string }>,
  kind: string,
  problems: string[],
) {
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) {
      problems.push(`duplicate ${kind} id "${record.id}"`);
    }
    seen.add(record.id);
  }
}

function validateBio(value: unknown, problems: string[]): Bio {
  const record = readRecord(value, "bio", problems);
  assertExactKeys(
    record,
    [
      "name",
      "monogram",
      "role",
      "affiliation",
      "affiliationCountry",
      "location",
      "biography",
      "seoTitle",
      "seoDescription",
    ],
    "bio",
    problems,
  );
  return {
    name: readString(record.name, "bio.name", problems),
    monogram: readString(record.monogram, "bio.monogram", problems),
    role: readString(record.role, "bio.role", problems),
    affiliation: readString(record.affiliation, "bio.affiliation", problems),
    affiliationCountry: readString(
      record.affiliationCountry,
      "bio.affiliationCountry",
      problems,
    ),
    location: readString(record.location, "bio.location", problems),
    biography: readString(record.biography, "bio.biography", problems),
    seoTitle: readString(record.seoTitle, "bio.seoTitle", problems),
    seoDescription: readString(
      record.seoDescription,
      "bio.seoDescription",
      problems,
    ),
  };
}

function validateLinks(value: unknown, problems: string[]): ProfileLink[] {
  const links = readArray(value, "links", problems).map((item, index) => {
    const record = readRecord(item, `link[${index}]`, problems);
    const label = recordLabel("link", record, index);
    assertExactKeys(record, ["id", "label", "url", "placement"], label, problems);
    const placement = readString(record.placement, `${label}.placement`, problems);
    if (placement !== "header" && placement !== "footer") {
      problems.push(`${label}.placement: expected "header" or "footer"`);
    }
    const url = readString(record.url, `${label}.url`, problems);
    const isRootRelative = url.startsWith("/") && !url.startsWith("//");
    if (!isRootRelative) {
      try {
        const protocol = new URL(url).protocol;
        if (protocol !== "https:" && protocol !== "mailto:") {
          problems.push(
            `${label}.url: expected an https:, mailto:, or root-relative URL`,
          );
        }
      } catch {
        problems.push(
          `${label}.url: expected an https:, mailto:, or root-relative URL`,
        );
      }
    }
    return {
      id: readString(record.id, `${label}.id`, problems),
      label: readString(record.label, `${label}.label`, problems),
      url,
      placement: placement === "footer" ? "footer" : "header",
    } satisfies ProfileLink;
  });
  assertUniqueIds(links, "link", problems);
  return links;
}

function validatePublications(
  value: unknown,
  problems: string[],
): Publication[] {
  const publications = readArray(value, "publications", problems).map(
    (item, index) => {
      const record = readRecord(item, `publication[${index}]`, problems);
      const label = recordLabel("publication", record, index);
      assertExactKeys(
        record,
        [
          "id",
          "title",
          "authors",
          "year",
          "type",
          "venueTags",
          "venueLong",
          "doi",
          "topics",
          "conferenceEditionId",
        ],
        label,
        problems,
      );
      const type = readString(record.type, `${label}.type`, problems);
      if (type !== "journal" && type !== "conference") {
        problems.push(`${label}.type: expected "journal" or "conference"`);
      }
      const doi = record.doi === null
        ? null
        : readString(record.doi, `${label}.doi`, problems);
      if (doi !== null && !/^10\.\d{4,9}\/\S+$/i.test(doi)) {
        problems.push(`${label}.doi: expected a bare DOI without https://doi.org/`);
      }
      const conferenceEditionId = record.conferenceEditionId === null
        ? null
        : readString(
            record.conferenceEditionId,
            `${label}.conferenceEditionId`,
            problems,
          );
      return {
        id: readString(record.id, `${label}.id`, problems),
        title: readString(record.title, `${label}.title`, problems),
        authors: readStringArray(record.authors, `${label}.authors`, problems),
        year: readNumber(record.year, `${label}.year`, problems),
        type: type === "journal" ? "journal" : "conference",
        venueTags: readStringArray(
          record.venueTags,
          `${label}.venueTags`,
          problems,
        ),
        venueLong: readString(record.venueLong, `${label}.venueLong`, problems),
        doi,
        topics: readStringArray(record.topics, `${label}.topics`, problems),
        conferenceEditionId,
      } satisfies Publication;
    },
  );
  assertUniqueIds(publications, "publication", problems);
  return publications;
}

function validateConferences(
  value: unknown,
  problems: string[],
): ConferenceEdition[] {
  const conferences = readArray(value, "conferences", problems).map(
    (item, index) => {
      const record = readRecord(item, `conference[${index}]`, problems);
      const label = recordLabel("conference", record, index);
      assertExactKeys(
        record,
        ["id", "series", "name", "year", "dates", "placeId"],
        label,
        problems,
      );
      return {
        id: readString(record.id, `${label}.id`, problems),
        series: readString(record.series, `${label}.series`, problems),
        name: readString(record.name, `${label}.name`, problems),
        year: readNumber(record.year, `${label}.year`, problems),
        dates: readString(record.dates, `${label}.dates`, problems),
        placeId: readString(record.placeId, `${label}.placeId`, problems),
      };
    },
  );
  assertUniqueIds(conferences, "conference", problems);
  return conferences;
}

function validateLocations(value: unknown, problems: string[]): Location[] {
  const locations = readArray(value, "locations", problems).map(
    (item, index) => {
      const record = readRecord(item, `location[${index}]`, problems);
      const label = recordLabel("location", record, index);
      assertExactKeys(
        record,
        ["id", "city", "region", "country", "latitude", "longitude"],
        label,
        problems,
      );
      const latitude = readNumber(record.latitude, `${label}.latitude`, problems);
      const longitude = readNumber(
        record.longitude,
        `${label}.longitude`,
        problems,
      );
      if (latitude < -90 || latitude > 90) {
        problems.push(`${label}.latitude: expected a value from -90 to 90`);
      }
      if (longitude < -180 || longitude > 180) {
        problems.push(`${label}.longitude: expected a value from -180 to 180`);
      }
      const region = readOptionalString(record.region, `${label}.region`, problems);
      return {
        id: readString(record.id, `${label}.id`, problems),
        city: readString(record.city, `${label}.city`, problems),
        ...(region ? { region } : {}),
        country: readString(record.country, `${label}.country`, problems),
        latitude,
        longitude,
      };
    },
  );
  assertUniqueIds(locations, "location", problems);
  return locations;
}

function validateResearchTopics(
  value: unknown,
  problems: string[],
): ResearchTopic[] {
  const topics = readArray(value, "researchTopics", problems).map(
    (item, index) => {
      const record = readRecord(item, `researchTopic[${index}]`, problems);
      const label = recordLabel("research topic", record, index);
      assertExactKeys(record, ["id", "label", "description"], label, problems);
      const description = readOptionalString(
        record.description,
        `${label}.description`,
        problems,
      );
      return {
        id: readString(record.id, `${label}.id`, problems),
        label: readString(record.label, `${label}.label`, problems),
        ...(description ? { description } : {}),
      };
    },
  );
  assertUniqueIds(topics, "research topic", problems);
  return topics;
}

function validateTravel(value: unknown, problems: string[]): TravelContent {
  const travel = readRecord(value, "travel", problems);
  assertExactKeys(travel, ["placeholder", "journeys"], "travel", problems);
  const placeholder = readRecord(
    travel.placeholder,
    "travel.placeholder",
    problems,
  );
  assertExactKeys(
    placeholder,
    ["title", "body"],
    "travel.placeholder",
    problems,
  );
  const journeys = readArray(travel.journeys, "travel.journeys", problems).map(
    (item, index) => {
      const record = readRecord(item, `journey[${index}]`, problems);
      const label = recordLabel("journey", record, index);
      assertExactKeys(
        record,
        ["id", "conferenceEditionId", "publicationIds", "images"],
        label,
        problems,
      );
      const publicationIds = record.publicationIds === undefined
        ? undefined
        : readStringArray(
            record.publicationIds,
            `${label}.publicationIds`,
            problems,
            true,
          );
      const images = readArray(record.images, `${label}.images`, problems).map(
        (image, imageIndex) => {
          const imageRecord = readRecord(
            image,
            `${label}.images[${imageIndex}]`,
            problems,
          );
          const imageLabel = `${label}.images[${imageIndex}]`;
          assertExactKeys(imageRecord, ["src", "alt", "caption"], imageLabel, problems);
          const src = readString(imageRecord.src, `${imageLabel}.src`, problems);
          if (!src.startsWith("/travel/")) {
            problems.push(`${imageLabel}.src: expected a path beginning "/travel/"`);
          }
          const caption = readOptionalString(
            imageRecord.caption,
            `${imageLabel}.caption`,
            problems,
          );
          return {
            src,
            alt: readString(imageRecord.alt, `${imageLabel}.alt`, problems),
            ...(caption ? { caption } : {}),
          };
        },
      );
      return {
        id: readString(record.id, `${label}.id`, problems),
        conferenceEditionId: readString(
          record.conferenceEditionId,
          `${label}.conferenceEditionId`,
          problems,
        ),
        ...(publicationIds ? { publicationIds } : {}),
        images,
      };
    },
  );
  assertUniqueIds(journeys, "journey", problems);
  return {
    placeholder: {
      title: readString(placeholder.title, "travel.placeholder.title", problems),
      body: readString(placeholder.body, "travel.placeholder.body", problems),
    },
    journeys,
  };
}

function validateRelationships(data: PortfolioData, problems: string[]) {
  const topicIds = new Set(data.researchTopics.map(({ id }) => id));
  const conferenceIds = new Set(data.conferences.map(({ id }) => id));
  const locationIds = new Set(data.locations.map(({ id }) => id));
  const publicationIds = new Set(data.publications.map(({ id }) => id));

  for (const publication of data.publications) {
    const label = `publication "${publication.id}"`;
    for (const topic of publication.topics) {
      if (!topicIds.has(topic)) problems.push(`${label}: unknown topic "${topic}"`);
    }
    if (
      publication.conferenceEditionId !== null &&
      !conferenceIds.has(publication.conferenceEditionId)
    ) {
      problems.push(
        `${label}: unknown conferenceEditionId "${publication.conferenceEditionId}"`,
      );
    }
    const authorCount = publication.authors.filter(
      (author) => author === data.bio.name,
    ).length;
    if (authorCount !== 1) {
      problems.push(`${label}: authors must include "${data.bio.name}" exactly once`);
    }
  }

  for (let index = 1; index < data.publications.length; index += 1) {
    if (data.publications[index].year > data.publications[index - 1].year) {
      problems.push(
        `publications: expected non-increasing year order at "${data.publications[index].id}"`,
      );
    }
  }

  for (const conference of data.conferences) {
    if (!locationIds.has(conference.placeId)) {
      problems.push(
        `conference "${conference.id}": unknown placeId "${conference.placeId}"`,
      );
    }
  }

  for (const journey of data.travel.journeys) {
    if (!conferenceIds.has(journey.conferenceEditionId)) {
      problems.push(
        `journey "${journey.id}": unknown conferenceEditionId "${journey.conferenceEditionId}"`,
      );
    }
    for (const publicationId of journey.publicationIds ?? []) {
      if (!publicationIds.has(publicationId)) {
        problems.push(
          `journey "${journey.id}": unknown publicationId "${publicationId}"`,
        );
      }
    }
  }
}

export function validatePortfolioData(raw: unknown): PortfolioData {
  const problems: string[] = [];
  const root = readRecord(raw, "content", problems);
  assertExactKeys(
    root,
    [
      "bio",
      "links",
      "publications",
      "conferences",
      "locations",
      "researchTopics",
      "travel",
    ],
    "content",
    problems,
  );

  const data: PortfolioData = {
    bio: validateBio(root.bio, problems),
    links: validateLinks(root.links, problems),
    publications: validatePublications(root.publications, problems),
    conferences: validateConferences(root.conferences, problems),
    locations: validateLocations(root.locations, problems),
    researchTopics: validateResearchTopics(root.researchTopics, problems),
    travel: validateTravel(root.travel, problems),
  };
  validateRelationships(data, problems);

  if (problems.length > 0) {
    throw new ContentValidationError(problems.join("\n"));
  }
  return data;
}
