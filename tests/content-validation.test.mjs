import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentValidationError,
  validatePortfolioData,
} from "../app/data/portfolio-schema.ts";

function validContent() {
  return {
    bio: {
      name: "Wen Sheng Lim",
      monogram: "WS",
      role: "PhD candidate",
      affiliation: "National Taiwan University (NTU)",
      affiliationCountry: "Taiwan",
      location: "Taipei, Taiwan",
      biography: "Profile copy.",
      seoTitle: "Wen Sheng Lim — Computer Systems Research",
      seoDescription: "Research profile.",
    },
    links: [
      {
        id: "header-scholar",
        label: "Scholar",
        url: "https://example.com",
        placement: "header",
      },
    ],
    publications: [
      {
        id: "paper-2026",
        title: "A Paper",
        authors: ["Wen Sheng Lim", "Co Author"],
        year: 2026,
        type: "conference",
        venueTags: ["TEST"],
        venueLong: "Test Conference",
        doi: "10.1000/test",
        topics: ["systems"],
        conferenceEditionId: "test-2026",
      },
    ],
    conferences: [
      {
        id: "test-2026",
        series: "TEST",
        name: "Test Conference",
        year: 2026,
        dates: "Jan. 1–2, 2026",
        placeId: "test-city",
      },
    ],
    locations: [
      {
        id: "test-city",
        city: "Test City",
        country: "Testland",
        latitude: 1,
        longitude: 2,
      },
    ],
    researchTopics: [
      { id: "systems", label: "Systems", description: "Systems research." },
    ],
    travel: {
      placeholder: { title: "Travel field notes", body: "Photos later." },
      journeys: [],
    },
  };
}

test("accepts a complete related content graph", () => {
  assert.deepEqual(validatePortfolioData(validContent()), validContent());
});

test("rejects unknown publication fields", () => {
  const raw = validContent();
  raw.publications[0].accepted = true;
  assert.throws(
    () => validatePortfolioData(raw),
    /publication "paper-2026".*unknown field "accepted"/s,
  );
});

test("rejects missing topic and conference references", () => {
  const raw = validContent();
  raw.publications[0].topics = ["missing-topic"];
  raw.publications[0].conferenceEditionId = "missing-2026";
  assert.throws(
    () => validatePortfolioData(raw),
    (error) => {
      assert.match(error.message, /unknown topic "missing-topic"/);
      assert.match(error.message, /unknown conferenceEditionId "missing-2026"/);
      return true;
    },
  );
});

test("rejects duplicate IDs, malformed DOIs, and invalid coordinates", () => {
  const duplicate = validContent();
  duplicate.locations.push({ ...duplicate.locations[0] });
  assert.throws(
    () => validatePortfolioData(duplicate),
    /duplicate location id "test-city"/,
  );

  const badDoi = validContent();
  badDoi.publications[0].doi = "https://doi.org/10.1000/test";
  assert.throws(() => validatePortfolioData(badDoi), /bare DOI/);

  const badCoordinate = validContent();
  badCoordinate.locations[0].latitude = 91;
  assert.throws(() => validatePortfolioData(badCoordinate), /latitude/);
});

test("rejects increasing publication years and an omitted profile author", () => {
  const order = validContent();
  order.publications.push({
    ...order.publications[0],
    id: "paper-2027",
    year: 2027,
  });
  assert.throws(
    () => validatePortfolioData(order),
    /non-increasing year order/,
  );

  const author = validContent();
  author.publications[0].authors = ["Someone Else"];
  assert.throws(
    () => validatePortfolioData(author),
    /must include "Wen Sheng Lim" exactly once/,
  );
});

test("exposes validation errors as ContentValidationError", () => {
  assert.throws(
    () => validatePortfolioData(null),
    (error) => error instanceof ContentValidationError,
  );
});

test("accepts root-relative link URLs but rejects other non-https/mailto forms", () => {
  const relative = validContent();
  relative.links.push({
    id: "header-cv",
    label: "CV",
    url: "/tundergod_CV.pdf",
    placement: "header",
  });
  const result = validatePortfolioData(relative);
  assert.equal(
    result.links.find((link) => link.id === "header-cv").url,
    "/tundergod_CV.pdf",
  );

  const badScheme = validContent();
  badScheme.links.push({
    id: "header-cv",
    label: "CV",
    url: "ftp://example.com/tundergod_CV.pdf",
    placement: "header",
  });
  assert.throws(
    () => validatePortfolioData(badScheme),
    /header-cv.*expected an https:, mailto:, or root-relative URL/s,
  );

  const notRootRelative = validContent();
  notRootRelative.links.push({
    id: "header-cv",
    label: "CV",
    url: "tundergod_CV.pdf",
    placement: "header",
  });
  assert.throws(
    () => validatePortfolioData(notRootRelative),
    /header-cv.*expected an https:, mailto:, or root-relative URL/s,
  );

  const protocolRelative = validContent();
  protocolRelative.links.push({
    id: "header-cv",
    label: "CV",
    url: "//example.com/tundergod_CV.pdf",
    placement: "header",
  });
  assert.throws(
    () => validatePortfolioData(protocolRelative),
    /header-cv.*expected an https:, mailto:, or root-relative URL/s,
  );
});
