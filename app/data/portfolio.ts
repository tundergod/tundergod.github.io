export type ResearchArea =
  | "Storage"
  | "Architecture"
  | "Intermittent"
  | "Robotics";

export type Publication = {
  id: string;
  title: string;
  authors: string;
  venue: string;
  venueTags?: string[];
  venueLong: string;
  year: number;
  type: "journal" | "conference";
  status?: string;
  areas: ResearchArea[];
  conferenceEditionId?: string;
};

export type Place = {
  id: string;
  city: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type ConferenceEdition = {
  id: string;
  series: string;
  name: string;
  year: number;
  dates: string;
  placeId: string;
};

export const places: Place[] = [
  { id: "san-jose", city: "San Jose", region: "California", country: "USA", latitude: 37.3382, longitude: -121.8863 },
  { id: "barcelona", city: "Barcelona", country: "Spain", latitude: 41.3874, longitude: 2.1686 },
  { id: "long-beach", city: "Long Beach", region: "California", country: "USA", latitude: 33.7701, longitude: -118.1937 },
  { id: "verona", city: "Verona", country: "Italy", latitude: 45.4384, longitude: 10.9916 },
  { id: "thessaloniki", city: "Thessaloniki", country: "Greece", latitude: 40.6401, longitude: 22.9444 },
  { id: "hong-kong", city: "Hong Kong", country: "Hong Kong", latitude: 22.3193, longitude: 114.1694 },
  { id: "san-francisco", city: "San Francisco", region: "California", country: "USA", latitude: 37.7749, longitude: -122.4194 },
  { id: "antwerp", city: "Antwerp", country: "Belgium", latitude: 51.2194, longitude: 4.4025 },
];

export const conferenceEditions: ConferenceEdition[] = [
  { id: "iccad-2026", series: "ICCAD", name: "ACM/IEEE International Conference on Computer-Aided Design", year: 2026, dates: "Nov. 8–12, 2026", placeId: "san-jose" },
  { id: "esweek-2026", series: "CASES / EMSOFT / CODES", name: "CASES / EMSOFT / CODES", year: 2026, dates: "Oct. 4–9, 2026", placeId: "barcelona" },
  { id: "dac-2026", series: "DAC", name: "ACM/IEEE The Chips to Systems Conference", year: 2026, dates: "Jul. 26–29, 2026", placeId: "long-beach" },
  { id: "date-2026", series: "DATE", name: "ACM/IEEE Design, Automation and Test in Europe Conference", year: 2026, dates: "Apr. 20–22, 2026", placeId: "verona" },
  { id: "sac-2026", series: "SAC", name: "ACM Symposium on Applied Computing", year: 2026, dates: "Mar. 23–27, 2026", placeId: "thessaloniki" },
  { id: "aspdac-2026", series: "ASP-DAC", name: "ACM/IEEE Asia and South Pacific Design Automation Conference", year: 2026, dates: "Jan. 19–22, 2026", placeId: "hong-kong" },
  { id: "iccad-2023", series: "ICCAD", name: "ACM/IEEE International Conference on Computer-Aided Design", year: 2023, dates: "Oct. 29–Nov. 2, 2023", placeId: "san-francisco" },
  { id: "date-2023", series: "DATE", name: "ACM/IEEE Design, Automation and Test in Europe Conference", year: 2023, dates: "Apr. 17–19, 2023", placeId: "antwerp" },
];

export const publications: Publication[] = [
  {
    id: "graphisc-tcad-2026",
    title: "GraphISC: Enabling Out-of-Core Graph Processing with Distributed Computational Storage",
    authors: "Ssu-Hao Tsai, Wen Sheng Lim, Liang-Chi Chen, Tei-Wei Kuo, and Yuan-Hao Chang",
    venue: "TCAD",
    venueTags: ["TCAD", "CASES / EMSOFT / CODES"],
    venueLong: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
    year: 2026,
    type: "journal",
    status: "Accepted",
    areas: ["Storage", "Architecture"],
    conferenceEditionId: "esweek-2026",
  },
  {
    id: "timing-composable-tecs-2026",
    title: "Timing-Constrained Composable Inference for Intermittent Systems using Reinforcement Learning",
    authors: "Wen Sheng Lim, Shu-Ting Cheng, Ya-Tung Tsai, Chia-Heng Tu, and Yuan-Hao Chang",
    venue: "TECS",
    venueLong: "ACM Transactions on Embedded Computing Systems",
    year: 2026,
    type: "journal",
    status: "Accepted",
    areas: ["Intermittent", "Architecture"],
  },
  {
    id: "progress-gambit-iccad-2026",
    title: "Progress Gambit: Rethinking Checkpointing for Intermittent Hyperdimensional Computing on Ultra-Low-Power Devices",
    authors: "Ya-Tung Tsai, Wen Sheng Lim, Yu-Cheng Chen, Chia-Heng Tu, and Yuan-Hao Chang",
    venue: "ICCAD",
    venueLong: "ACM/IEEE International Conference on Computer-Aided Design",
    year: 2026,
    type: "conference",
    areas: ["Intermittent", "Architecture"],
    conferenceEditionId: "iccad-2026",
  },
  {
    id: "winhd-cases-2026",
    title: "WinHD: Efficient Fixed-Point Model Hyperdimensional Computing for Off-the-Shelf Edge Devices",
    authors: "Yu-Cheng Chen, Wen Sheng Lim, Ya-Tung Tsai, Chia-Heng Tu, and Yuan-Hao Chang",
    venue: "TCAD",
    venueTags: ["TCAD", "CASES / EMSOFT / CODES"],
    venueLong: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
    year: 2026,
    type: "journal",
    status: "Accepted",
    areas: ["Architecture"],
    conferenceEditionId: "esweek-2026",
  },
  {
    id: "rememtier-dac-2026",
    title: "ReMemTier: Rethinking Memory Tiering for CXL-based SSD via Large Granularity Memory Access",
    authors: "Yi-Sia Gao, Wen Sheng Lim, Tei-Wei Kuo, and Yuan-Hao Chang",
    venue: "DAC",
    venueLong: "ACM/IEEE The Chips to Systems Conference",
    year: 2026,
    type: "conference",
    areas: ["Storage", "Architecture"],
    conferenceEditionId: "dac-2026",
  },
  {
    id: "flashhd-dac-2026",
    title: "FlashHD: A Flash-Based In-Storage Hyperdimensional Computing Framework for Hierarchical Sequence Matching",
    authors: "Wen-Hsin Liu, Chieh-Lin Tsai, Wen Sheng Lim, Ray-Ting Huang, Han-Wen Hu, Tei-Wei Kuo, and Yuan-Hao Chang",
    venue: "DAC",
    venueLong: "ACM/IEEE The Chips to Systems Conference",
    year: 2026,
    type: "conference",
    areas: ["Storage", "Architecture"],
    conferenceEditionId: "dac-2026",
  },
  {
    id: "star-date-2026",
    title: "STAR: High-DoF Robotic Manipulation for Memory-Constrained NN Accelerator",
    authors: "Jhao-Ying Chen, Wen Sheng Lim, Tei-Wei Kuo, and Yuan-Hao Chang",
    venue: "DATE",
    venueLong: "ACM/IEEE Design, Automation and Test in Europe Conference",
    year: 2026,
    type: "conference",
    areas: ["Robotics", "Architecture"],
    conferenceEditionId: "date-2026",
  },
  {
    id: "volunteer-computing-sac-2026",
    title: "A Volunteer Computing Framework for IoT Devices using Intermittent Computing",
    authors: "Wen Sheng Lim, Chia-Heng Tu, and Yuan-Hao Chang",
    venue: "SAC",
    venueLong: "ACM Symposium on Applied Computing",
    year: 2026,
    type: "conference",
    areas: ["Intermittent"],
    conferenceEditionId: "sac-2026",
  },
  {
    id: "recross-sac-2026",
    title: "ReCross: Efficient Embedding Reduction Scheme for In-Memory Computing using ReRAM-Based Crossbar",
    authors: "Yu-Hong Lai, Chieh-Lin Tsai, Wen Sheng Lim, Han-Wen Hu, Tei-Wei Kuo, and Yuan-Hao Chang",
    venue: "SAC",
    venueLong: "ACM Symposium on Applied Computing",
    year: 2026,
    type: "conference",
    areas: ["Architecture"],
    conferenceEditionId: "sac-2026",
  },
  {
    id: "sara-aspdac-2026",
    title: "SARA: A Stall-Aware Memory Allocation Strategy for Mixed-Criticality Systems",
    authors: "Meng-Chia Lee, Wen Sheng Lim, Yuan-Hao Chang, and Tei-Wei Kuo",
    venue: "ASP-DAC",
    venueLong: "ACM/IEEE Asia and South Pacific Design Automation Conference",
    year: 2026,
    type: "conference",
    areas: ["Architecture"],
    conferenceEditionId: "aspdac-2026",
  },
  {
    id: "isafe-tcad-2025",
    title: "iSAFE: Enabling Evenness of Data Freshness in Multipriority Networked Intermittent Systems",
    authors: "Wen Sheng Lim, Yu-Cheng Chen, Yu-Hsuan Chu, Chia-Heng Tu, and Yuan-Hao Chang",
    venue: "TCAD",
    venueLong: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
    year: 2025,
    type: "journal",
    status: "Vol. 44, No. 6",
    areas: ["Intermittent", "Architecture"],
  },
  {
    id: "flash-survey-tos-2025",
    title: "A Survey on Flash-Memory Storage Systems: A Host-Side Perspective",
    authors: "Jalil Boukhobza, Pierre Olivier, Wen Sheng Lim, Liang-Chi Chen, Yun-Shan Hsieh, Shin-Ting Wu, Chien-Chung Ho, Po-Chun Huang, and Yuan-Hao Chang",
    venue: "TOS",
    venueLong: "ACM Transactions on Storage",
    year: 2025,
    type: "journal",
    status: "Vol. 21, No. 3",
    areas: ["Storage"],
  },
  {
    id: "train-iccad-2023",
    title: "TRAIN: A Reinforcement Learning Based Timing-Aware Neural Inference on Intermittent Systems",
    authors: "Shu-Ting Cheng, Wen Sheng Lim, Chia-Heng Tu, and Yuan-Hao Chang",
    venue: "ICCAD",
    venueLong: "ACM/IEEE International Conference on Computer-Aided Design",
    year: 2023,
    type: "conference",
    areas: ["Intermittent", "Architecture"],
    conferenceEditionId: "iccad-2023",
  },
  {
    id: "data-freshness-date-2023",
    title: "Data Freshness Optimization on Networked Intermittent Systems",
    authors: "Hao-Jan Huang, Wen Sheng Lim, Chia-Heng Tu, Chun-Feng Wu, and Yuan-Hao Chang",
    venue: "DATE",
    venueLong: "ACM/IEEE Design, Automation and Test in Europe Conference",
    year: 2023,
    type: "conference",
    areas: ["Intermittent"],
    conferenceEditionId: "date-2023",
  },
  {
    id: "icheck-tcad-2021",
    title: "iCheck: Progressive Checkpointing for Intermittent Systems",
    authors: "Wen Sheng Lim, Chia-Heng Tu, Chun-Feng Wu, and Yuan-Hao Chang",
    venue: "TCAD",
    venueLong: "IEEE Transactions on Computer-Aided Design of Integrated Circuits and Systems",
    year: 2021,
    type: "journal",
    status: "Vol. 40, No. 11",
    areas: ["Intermittent", "Architecture"],
  },
];

export const researchAreas: Array<{
  id: ResearchArea;
  label: string;
  description: string;
}> = [
  { id: "Storage", label: "Memory + Storage", description: "Flash, CXL, computational storage, and data movement." },
  { id: "Architecture", label: "Computer Architecture", description: "Efficient systems from edge devices to accelerators." },
  { id: "Intermittent", label: "Intermittent Computing", description: "Progress, timing, and freshness under unstable power." },
  { id: "Robotics", label: "Robotics", description: "Resource-aware perception and manipulation systems." },
];
