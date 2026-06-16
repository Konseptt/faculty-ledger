import * as cheerio from "cheerio";
import { initialsAvatarDataUri } from "@/lib/initialsAvatar";

const USER_AGENT = "ProfessorReviewHub/1.0 (faculty photo lookup)";
const FETCH_TIMEOUT_MS = 6000;
const MAX_PROFILE_CHECKS = 24;

export interface FacultyPhotoResult {
  photoUrl: string;
  profileUrl?: string;
  source: "university" | "wikipedia" | "initials";
}

const MIN_IMAGE_BYTES = 1500;
const PHOTO_CACHE_TTL_MS = 30 * 60 * 1000;
const photoCache = new Map<string, { value: FacultyPhotoResult; expires: number }>();

export function __clearPhotoCache() {
  photoCache.clear();
}

export function isValidImageResponse(res: Response): boolean {
  if (!res.ok) return false;
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) return false;
  const len = Number(res.headers.get("content-length") ?? "0");
  if (len > 0 && len < MIN_IMAGE_BYTES) return false;
  return true;
}

async function headValidateImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timer);
    return isValidImageResponse(res);
  } catch {
    return false;
  }
}

const DEPARTMENT_ACCENT: Record<string, string> = {
  chemistry: "#C4956A", biology: "#6B9E78", physics: "#5B7FA5",
  mathematics: "#8B6FAF", computer: "#4A8B8B", engineering: "#7A6B5A",
  psychology: "#7B8BA6", economics: "#6B8B6B",
};
function accentFor(department: string): string {
  const lower = department.toLowerCase();
  for (const [k, v] of Object.entries(DEPARTMENT_ACCENT)) if (lower.includes(k)) return v;
  return "#4A5D8C";
}


function nameParts(fullName: string): { first: string; last: string; slugs: string[] } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.toLowerCase() ?? "";
  const last = parts[parts.length - 1]?.toLowerCase() ?? "";
  const middle = parts.slice(1, -1).map((p) => p.toLowerCase());

  const slugs = new Set<string>();
  if (first && last) {
    slugs.add(`${first}-${last}`);
    slugs.add(`${last}-${first}`);
    if (middle.length > 0) {
      slugs.add(`${first}-${middle.join("-")}-${last}`);
    }
    slugs.add(`${first[0]}${last}`);
    slugs.add(`${first}.${last}`);
  }

  return { first, last, slugs: [...slugs].filter(Boolean) };
}

function departmentSubdomains(department: string): string[] {
  const lower = department.toLowerCase();
  const map: Record<string, string[]> = {
    computer: ["www.cs", "cs", "www.eecs", "eecs"],
    engineering: ["engineering", "www.engineering"],
    medicine: ["med", "medicine"],
    business: ["gsb", "business"],
    law: ["law"],
    physics: ["physics"],
    chemistry: ["chemistry", "chem"],
    biology: ["biology", "bio"],
    mathematics: ["math", "mathematics"],
    psychology: ["psychology"],
    economics: ["economics"],
  };

  const subs: string[] = ["profiles", "www"];
  for (const [key, values] of Object.entries(map)) {
    if (lower.includes(key)) subs.unshift(...values);
  }
  return [...new Set(subs)];
}

function rootDomainFromWebsite(website: string): string | null {
  try {
    return new URL(website).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function pageMatchesProfessor(html: string, fullName: string): boolean {
  const { first, last } = nameParts(fullName);
  const text = cheerio.load(html).text().toLowerCase().replace(/\s+/g, " ");
  return text.includes(first) && text.includes(last);
}

function isLikelyPortraitSrc(src: string): boolean {
  const lower = src.toLowerCase();
  if (/(logo|icon|sprite|banner|placeholder|avatar-default|seal|shield|favicon)/.test(lower)) {
    return false;
  }
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower) || /renditions|profile|headshot|photo|portrait|people|media\/person/i.test(lower);
}

function absolutizeUrl(baseUrl: string, src: string): string | null {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

function imageOnUniversityHost(imageUrl: string, rootDomain: string): boolean {
  try {
    const host = new URL(imageUrl).hostname;
    return host === rootDomain || host.endsWith(`.${rootDomain}`);
  } catch {
    return false;
  }
}

function extractProfileImages(
  html: string,
  pageUrl: string,
  rootDomain: string,
  fullName: string,
): string[] {
  const $ = cheerio.load(html);
  const candidates: { url: string; score: number }[] = [];
  const { first, last } = nameParts(fullName);

  // 1. Crawl structured JSON-LD data for Person schema
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawText = $(el).html();
      if (!rawText) return;
      const data = JSON.parse(rawText.trim());
      
      const checkPerson = (obj: unknown) => {
        if (!obj || typeof obj !== "object") return;
        
        if (Array.isArray(obj)) {
          obj.forEach(checkPerson);
          return;
        }
        
        const record = obj as Record<string, unknown>;
        if (record["@graph"] && Array.isArray(record["@graph"])) {
          record["@graph"].forEach(checkPerson);
          return;
        }

        const type = record["@type"];
        const isPerson = 
          type === "Person" || 
          (Array.isArray(type) && type.includes("Person"));
          
        if (isPerson) {
          const name = String(record["name"] || "").toLowerCase();
          if (name.includes(first) && name.includes(last)) {
            const img = record["image"] || record["photo"];
            if (img) {
              let imgUrl = "";
              if (typeof img === "string") {
                imgUrl = img;
              } else if (img && typeof img === "object") {
                const imgObj = img as Record<string, unknown>;
                imgUrl = String(imgObj.url || imgObj.contentUrl || "");
              }
              if (imgUrl) {
                candidates.push({ url: imgUrl, score: 200 });
              }
            }
          }
        }
      };
      
      checkPerson(data);
    } catch {
      // Ignore JSON parse errors
    }
  });

  // 2. Scan meta tags (OpenGraph / Twitter)
  const metaImage =
    $('meta[property="og:image"]').attr("content") ??
    $('meta[name="twitter:image"]').attr("content");
  
  if (metaImage) {
    let score = 5;
    const lowerMeta = metaImage.toLowerCase();
    const hasName = (first && lowerMeta.includes(first)) || (last && lowerMeta.includes(last));
    const hasPortraitKeyword = /(profile|headshot|photo|portrait|faculty|person)/.test(lowerMeta);
    if (hasName) score += 50;
    if (hasPortraitKeyword) score += 20;
    if (!hasName && !hasPortraitKeyword) score -= 10;
    candidates.push({ url: metaImage, score });
  }

  // 3. Scan ordinary image elements
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src") ?? "";
    if (!src) return;
    
    const alt = ($(el).attr("alt") ?? "").toLowerCase();
    const className = ($(el).attr("class") ?? "").toLowerCase();
    const lowerSrc = src.toLowerCase();
    const meta = `${alt} ${className} ${lowerSrc}`;
    
    if (!isLikelyPortraitSrc(src)) return;

    let score = 10;
    const hasNameInAlt = (first && alt.includes(first)) || (last && alt.includes(last));
    const hasNameInSrc = (first && lowerSrc.includes(first)) || (last && lowerSrc.includes(last));
    const hasPortraitKeyword = /(profile|headshot|photo|portrait|faculty|person|media\/person)/.test(meta);
    const hasGenericKeyword = /(logo|icon|banner|footer|header|nav|seal|shield)/.test(meta);

    if (hasNameInAlt) score += 100;
    if (hasNameInSrc) score += 80;
    if (hasPortraitKeyword) score += 30;
    if (hasGenericKeyword) score -= 60;

    candidates.push({ url: src, score });
  });

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  for (const cand of candidates) {
    const absolute = absolutizeUrl(pageUrl, cand.url);
    if (absolute && isLikelyPortraitSrc(absolute) && imageOnUniversityHost(absolute, rootDomain)) {
      result.push(absolute);
    }
  }

  return [...new Set(result)];
}

function buildProfileCandidates(rootDomain: string, slugs: string[], department: string): string[] {
  const subs = departmentSubdomains(department).slice(0, 4);
  const paths = ["people/{slug}", "faculty/{slug}", "profiles/{slug}", "profile/{slug}"];

  const urls: string[] = [];
  for (const sub of subs) {
    for (const slug of slugs.slice(0, 3)) {
      for (const path of paths) {
        urls.push(`https://${sub}.${rootDomain}/${path.replace("{slug}", slug)}`);
      }
    }
  }
  // Try on root domain directly (without subdomains)
  for (const slug of slugs.slice(0, 3)) {
    for (const path of paths) {
      urls.push(`https://${rootDomain}/${path.replace("{slug}", slug)}`);
    }
  }
  return urls;
}

async function tryProfileUrl(
  profileUrl: string,
  fullName: string,
  rootDomain: string,
): Promise<FacultyPhotoResult | null> {
  const html = await fetchHtml(profileUrl);
  if (!html || !pageMatchesProfessor(html, fullName)) return null;
  const photoUrls = extractProfileImages(html, profileUrl, rootDomain, fullName);
  for (const url of photoUrls) {
    if (await headValidateImage(url)) {
      return { photoUrl: url, profileUrl, source: "university" };
    }
  }
  return null;
}

async function findProfileViaFacultyListing(
  rootDomain: string,
  fullName: string,
  department: string,
): Promise<FacultyPhotoResult | null> {
  const { first, last } = nameParts(fullName);
  const subs = departmentSubdomains(department).slice(0, 4);
  const listingPaths = ["/people/faculty", "/faculty", "/people", "/directory/faculty"];

  for (const sub of subs) {
    for (const path of listingPaths) {
      const listingUrl = `https://${sub}.${rootDomain}${path}`;
      const html = await fetchHtml(listingUrl);
      if (!html) continue;

      const $ = cheerio.load(html);
      const profileLinks: string[] = [];

      $("a").each((_, el) => {
        const text = $(el).text().toLowerCase().replace(/\s+/g, " ");
        const href = $(el).attr("href");
        if (!href) return;
        if (text.includes(first) && text.includes(last)) {
          const absolute = absolutizeUrl(listingUrl, href);
          if (absolute) profileLinks.push(absolute);
        }
      });

      for (const profileUrl of profileLinks.slice(0, 3)) {
        const result = await tryProfileUrl(profileUrl, fullName, rootDomain);
        if (result) return result;
      }
    }
  }

  return null;
}

export async function resolveUniversityWebsite(university: string): Promise<string | null> {
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(university)}&limit=1&format=json`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  if (!searchRes.ok) return null;

  const [, titles] = (await searchRes.json()) as [string, string[]];
  let title: string | undefined = titles[0];

  if (!title) {
    // Fallback to Wikipedia search API
    try {
      const queryRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(university)}&utf8=&format=json&limit=1`,
        { headers: { "User-Agent": USER_AGENT } }
      );
      if (queryRes.ok) {
        const qdata = await queryRes.json() as { query?: { search?: { title: string }[] } };
        title = qdata.query?.search?.[0]?.title;
      }
    } catch {
      // ignore
    }
  }

  if (!title) return null;

  let wikidataId: string | null = null;
  try {
    const propsRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(title)}&format=json`,
      { headers: { "User-Agent": USER_AGENT } },
    );
    if (propsRes.ok) {
      const propsData = await propsRes.json();
      const pages = propsData.query?.pages ?? {};
      const page = Object.values(pages)[0] as { pageprops?: { wikibase_item?: string } };
      wikidataId = page.pageprops?.wikibase_item ?? null;
    }
  } catch {
    // ignore
  }

  // Fallback 1: Wikidata website property P856
  if (wikidataId) {
    try {
      const entityRes = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (entityRes.ok) {
        const entityData = await entityRes.json();
        const website = entityData.entities?.[wikidataId]?.claims?.P856?.[0]?.mainsnak?.datavalue?.value;
        if (typeof website === "string") return website;
      }
    } catch {
      // ignore
    }
  }

  // Fallback 2: extlinks property on the Wikipedia page
  try {
    const extRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extlinks&titles=${encodeURIComponent(title)}&format=json`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (extRes.ok) {
      const extData = await extRes.json();
      const pages = extData.query?.pages ?? {};
      const page = Object.values(pages)[0] as { extlinks?: { "*": string }[] };
      const links = page.extlinks?.map(l => l["*"]) || [];
      const eduLink = links.find(l => /\.edu($|\/)/i.test(l) || /\.ac\.[a-z]{2}($|\/)/i.test(l) || /\.edu\.[a-z]{2}($|\/)/i.test(l));
      if (eduLink) return eduLink;
    }
  } catch {
    // ignore
  }

  return null;
}

async function findProfileViaSearchEngine(
  rootDomain: string,
  fullName: string,
): Promise<string[]> {
  try {
    const query = `site:${rootDomain} "${fullName}" faculty profile`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const html = await fetchHtml(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const urls: string[] = [];

    $("a.result__url").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const parsed = new URL(href);
        let finalUrl = href;
        if (parsed.searchParams.has("uddg")) {
          finalUrl = parsed.searchParams.get("uddg") || href;
        }
        if (finalUrl.includes(rootDomain) && !finalUrl.includes("duckduckgo.com")) {
          urls.push(finalUrl);
        }
      } catch {
        // ignore
      }
    });

    return [...new Set(urls)].slice(0, 5);
  } catch {
    return [];
  }
}

export async function findFacultyPhoto(
  fullName: string,
  university: string,
  department: string,
): Promise<FacultyPhotoResult | null> {
  const website = await resolveUniversityWebsite(university);
  const rootDomain = website ? rootDomainFromWebsite(website) : null;
  if (!rootDomain) return null;

  const listingResult = await findProfileViaFacultyListing(rootDomain, fullName, department);
  if (listingResult) return listingResult;

  const { slugs } = nameParts(fullName);
  const candidates = buildProfileCandidates(rootDomain, slugs, department).slice(0, MAX_PROFILE_CHECKS);

  for (const profileUrl of candidates) {
    const result = await tryProfileUrl(profileUrl, fullName, rootDomain);
    if (result) return result;
  }

  // Fallback: Search the university's domain via public search engine to find the profile url
  const searchEngineUrls = await findProfileViaSearchEngine(rootDomain, fullName);
  for (const profileUrl of searchEngineUrls) {
    const result = await tryProfileUrl(profileUrl, fullName, rootDomain);
    if (result) return result;
  }

  return null;
}

async function findWikipediaPhoto(
  fullName: string,
  university: string,
): Promise<FacultyPhotoResult | null> {
  try {
    // Search Wikipedia to get the most relevant pages
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(fullName + " " + university)}&utf8=&format=json&limit=3`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    let titlesToTry: string[] = [fullName];
    if (searchRes.ok) {
      const sdata = await searchRes.json() as { query?: { search?: { title: string }[] } };
      const searchTitles = sdata.query?.search?.map(s => s.title) || [];
      titlesToTry = [...new Set([...searchTitles, fullName])];
    }

    for (const title of titlesToTry.slice(0, 3)) {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: { "User-Agent": USER_AGENT } },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        thumbnail?: { source?: string };
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
      };
      const thumb = data.thumbnail?.source;
      if (!thumb) continue;

      const extract = (data.extract ?? "").toLowerCase();
      
      // Filter out common stop words from the university name
      const stopWords = new Set(["the", "of", "and", "at", "in", "for", "on", "a", "university", "college"]);
      const keywords = university
        .toLowerCase()
        .split(/[\s,&\-]+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
      
      const isAssociated = keywords.length > 0
        ? keywords.some(word => extract.includes(word))
        : extract.includes(university.toLowerCase().split(" ")[0]);

      if (isAssociated) {
        return { photoUrl: thumb, profileUrl: data.content_urls?.desktop?.page, source: "wikipedia" };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function resolveProfessorPhoto(
  fullName: string,
  university: string,
  department: string,
): Promise<FacultyPhotoResult> {
  const key = `${fullName.toLowerCase()}|${university.toLowerCase()}`;
  const cached = photoCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  let result: FacultyPhotoResult | null = null;

  // Tier 1: university faculty crawler (existing), with HEAD validation.
  const crawled = await findFacultyPhoto(fullName, university, department);
  if (crawled && (await headValidateImage(crawled.photoUrl))) {
    result = crawled;
  }

  // Tier 2: Wikipedia thumbnail.
  if (!result) {
    result = await findWikipediaPhoto(fullName, university);
  }

  // Tier 3: monogram initials when no photo is found.
  if (!result) {
    result = {
      photoUrl: initialsAvatarDataUri(fullName, accentFor(department)),
      source: "initials",
    };
  }

  photoCache.set(key, { value: result, expires: Date.now() + PHOTO_CACHE_TTL_MS });
  return result;
}
