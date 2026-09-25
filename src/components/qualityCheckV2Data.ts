// -----------------------------------------------------------------------------
// qualityCheckV2Data — dados mockados do Quality Check V2 (QualityCheckV2).
//
// Próprios da V2 de propósito: não reusa os mocks da V1 (QualityCheckPanel).
//
// Modelo: o codebook treinado usa os MESMOS codes do codebook de origem (só as
// regras são geradas). O QC roda o AI coder numa pergunta já codificada
// manualmente e compara, resposta a resposta, os codes manuais vs. os da AI —
// comparação determinística 1:1, sem LLM-as-judge.
//
// Amostra: 100 respostas, 20 com diferença (match rate de 80%). As 20 são, na
// maioria, respostas longas e informais, com 2–4 codes de diferença cada,
// misturando "AI missed", "AI added" e os dois. Também cobrem os casos de
// estresse do layout: uma resposta com 10+ codes, nomes de code longos, uma
// resposta em que a AI não aplicou nenhum code e duas curtas. As outras 80 são
// geradas de forma determinística (manual = AI) só para alimentar as contagens
// (ex.: coluna "Manual coding (sample)" da visão By code).
// -----------------------------------------------------------------------------

export interface QcResponse {
    id: string;
    text: string;
    manualCodes: string[];
    aiCodes: string[];
}

export interface QcDerivedResponse extends QcResponse {
    inBoth: string[];
    onlyManual: string[];
    onlyAI: string[];
    hasDifference: boolean;
}

/** Pergunta exibida quando o fluxo não traz uma pergunta de amostra. */
export const FALLBACK_SAMPLE = {
    text: 'Q4. What do you like most about your streaming service?',
};

// Codes do codebook (mock) -----------------------------------------------------

const C = {
    library: 'Content library & variety',
    originals: 'Original series',
    price: 'Price / value for money',
    adFree: 'Ad-free experience',
    ease: 'Ease of use / interface',
    recs: 'Recommendations & personalization',
    offline: 'Offline downloads',
    quality: 'Streaming quality (4K, HDR)',
    devices: 'Device compatibility (smart TV, console)',
    profiles: 'Multiple profiles & family sharing',
    continueWatching: 'Picks up where I left off across devices (continue watching)',
    sports: 'Live sports',
    kids: 'Kids & family content',
    movies: 'Movies',
    docs: 'Documentaries',
    cancel: 'No contract / cancel anytime',
    cable: 'Replacement for cable TV',
    bundle: 'Bundled with other subscriptions',
    international: 'International & foreign-language titles',
    releases: 'New releases available quickly',
    satisfied: 'General satisfaction',
    dontKnow: "Nothing specific / don't know",
} as const;

// Respostas com diferença (casos de estresse) ----------------------------------

const DIFF_RESPONSES: Record<number, Omit<QcResponse, 'id'>> = {
    3: {
        text: 'Mostly the documentaries and the international stuff. I got really into Korean dramas during lockdown and this is the only service with a decent selection and good subtitles. My husband watches the nature docs with the kids on weekends. The app itself is kind of clunky though, search never finds what I type on the first try.',
        manualCodes: [C.docs, C.international, C.kids],
        aiCodes: [C.docs, C.ease, C.movies],
    },
    7: {
        text: 'The originals, hands down. I started for one show everybody was talking about and stayed for like five others. And there are no ads, which after years of cable feels like a luxury. I’d pay a bit more just to keep it that way.',
        manualCodes: [C.originals, C.adFree, C.cable],
        aiCodes: [C.library, C.adFree, C.price],
    },
    11: {
        text: 'I like that I can put something on for the kids while I cook and not worry about what comes on next. The kids profile locks everything else out. Other than that I don’t use it much myself, maybe a movie on Friday night.',
        manualCodes: [C.kids, C.profiles],
        aiCodes: [C.kids, C.profiles, C.movies, C.satisfied, C.library],
    },
    // A AI não aplicou nenhum code.
    14: {
        text: 'that I can watch on the subway with no signal lol',
        manualCodes: [C.offline],
        aiCodes: [],
    },
    19: {
        text: 'Honestly it’s the only reason I canceled cable. Between this and the free news apps I don’t miss anything. Plus I can quit any month if the price goes up again, which it probably will lol.',
        manualCodes: [C.cable, C.cancel, C.price],
        aiCodes: [C.cable],
    },
    // Texto longo + 10+ codes.
    23: {
        text:
            'Where do I even start. The library is huge and there is always something new, from the big originals everyone talks about at work to random older movies I forgot existed. For the price it is honestly hard to beat, especially since we went with the plan with no ads, which makes a huge difference when you are binge watching. The recommendations are scary accurate, it figured out I love true crime documentaries within a week. It works on basically every device in the house: the smart TV in the living room, my son’s Xbox, my phone and the old iPad. Everyone has their own profile so the cartoons don’t mess up my suggestions, and there is a kids section that I actually trust. I also love that it picks up exactly where I left off when I switch from the TV to my phone on the way to work.',
        manualCodes: [
            C.library, C.originals, C.movies, C.price, C.adFree, C.recs,
            C.docs, C.devices, C.profiles, C.kids, C.continueWatching,
        ],
        aiCodes: [
            C.library, C.originals, C.movies, C.price, C.adFree, C.recs,
            C.devices, C.profiles, C.kids, C.continueWatching, C.ease,
        ],
    },
    27: {
        text: 'Downloads!! I travel for work almost every week and being able to download a whole season before a flight is a lifesaver. Quality is still good offline too. Wish more movies were downloadable, a lot of the newer ones aren’t.',
        manualCodes: [C.offline, C.quality],
        aiCodes: [C.offline, C.movies, C.releases],
    },
    // Nomes de code longos.
    31: {
        text: 'Works on my PS5 and the TV in the bedroom, and my daughter has her own profile with just her shows so she stops messing with my continue watching row. Setting it up on the console took like two minutes.',
        manualCodes: [C.devices, C.profiles, C.kids, C.continueWatching, C.ease],
        aiCodes: [C.devices, C.profiles],
    },
    36: {
        text: 'The recommendations. It’s weird how well it knows me. I finished a show last night and the next thing it suggested was exactly what I was in the mood for.',
        manualCodes: [C.recs],
        aiCodes: [C.recs, C.library, C.satisfied],
    },
    40: {
        text: 'tbh the price used to be the main thing but its gone up twice this year so now its more that everyone in the family uses it, we have 4 profiles going. my mom watches her spanish novelas, my kids watch cartoons and i watch whatever new thing drops on friday. hard to replace that with one other app',
        manualCodes: [C.profiles, C.international, C.kids, C.releases],
        aiCodes: [C.profiles, C.price, C.kids, C.bundle],
    },
    46: {
        text: 'Price. Way cheaper than cable was and I can cancel whenever I want without calling anyone. It also came free for 6 months with my phone plan so I got hooked before I ever paid for it.',
        manualCodes: [C.price, C.cancel, C.cable, C.bundle],
        aiCodes: [C.price, C.cancel, C.bundle, C.satisfied],
    },
    // Texto longo.
    52: {
        text:
            'Honestly the picture quality is what sold me. We upgraded to a 4K TV last year and most of the other apps still looked blurry, but here everything is sharp and the HDR on the nature documentaries is unbelievable. The recommendations also got a lot better over time — it now mostly suggests documentaries and a few thrillers, which is exactly what I watch. The only thing I would change is that new movies take a while to show up compared to renting them, but I have made peace with that.',
        manualCodes: [C.quality, C.docs, C.recs],
        aiCodes: [C.quality, C.docs, C.recs, C.releases, C.movies],
    },
    57: {
        text: 'Picture and sound quality are top notch, it’s the only app where Dolby Atmos actually works on my soundbar. I also like that I can start a movie on the TV and finish it on the tablet in bed. Live sports would make it perfect but I get that that’s expensive.',
        manualCodes: [C.quality, C.continueWatching, C.devices, C.movies],
        aiCodes: [C.quality],
    },
    61: {
        text: 'Nothing really stands out, it’s just the one we’ve had the longest. The kids like it and I don’t want to deal with switching all the logins on the TVs.',
        manualCodes: [C.satisfied, C.kids, C.devices],
        aiCodes: [C.dontKnow, C.kids],
    },
    68: {
        text: 'Sunday football without paying for a cable package. That’s it, that’s the whole reason. During the offseason I pause the subscription and come back in September.',
        manualCodes: [C.sports, C.cable, C.cancel],
        aiCodes: [C.sports],
    },
    73: {
        text: 'I mostly watch old movies and classic TV shows, the kind of stuff you can’t find anywhere else anymore. The catalog of older films is really deep. New releases I don’t care about.',
        manualCodes: [C.movies, C.library],
        aiCodes: [C.movies, C.library, C.releases, C.originals],
    },
    79: {
        text: 'The interface is clean and fast compared to the others I’ve tried, no weird autoplay trailers screaming at you when you open it. Search actually works. Also love the skip intro button, small thing but I use it constantly.',
        manualCodes: [C.ease],
        aiCodes: [C.ease, C.adFree, C.recs],
    },
    85: {
        text: 'idk, it’s fine I guess',
        manualCodes: [C.dontKnow],
        aiCodes: [C.satisfied],
    },
    90: {
        text: 'We use it on the long car trips, the kids each have a tablet with downloaded episodes and there are zero fights about what to watch. It’s worth it for that alone.',
        manualCodes: [C.offline, C.kids, C.profiles, C.price],
        aiCodes: [C.kids],
    },
    96: {
        text: 'I like that they drop the whole season at once so I can binge on the weekend, and the originals are usually better than what’s on regular TV. The foreign shows with dubbing are a nice bonus. Only complaint is that the app crashes on my old Roku.',
        manualCodes: [C.releases, C.originals, C.international],
        aiCodes: [C.originals, C.international, C.devices, C.library],
    },
};

// Respostas sem diferença (geradas) --------------------------------------------

// Pool e frases usadas para montar as respostas concordantes.
const MATCHED_POOL: { code: string; phrase: string }[] = [
    { code: C.library, phrase: 'there is always something to watch' },
    { code: C.originals, phrase: 'their original shows' },
    { code: C.price, phrase: 'good value for the price' },
    { code: C.adFree, phrase: 'no commercials' },
    { code: C.ease, phrase: 'the app is easy to use' },
    { code: C.recs, phrase: 'the suggestions are spot on' },
    { code: C.offline, phrase: 'I can download episodes for flights' },
    { code: C.quality, phrase: 'the picture is really sharp' },
    { code: C.devices, phrase: 'it works on my TV and my phone' },
    { code: C.profiles, phrase: 'we share one account as a family' },
    { code: C.sports, phrase: 'live games' },
    { code: C.kids, phrase: 'lots of shows for the kids' },
    { code: C.movies, phrase: 'good movie selection' },
    { code: C.docs, phrase: 'great documentaries' },
    { code: C.cancel, phrase: 'I can cancel anytime' },
    { code: C.cable, phrase: 'I could finally drop cable' },
    { code: C.bundle, phrase: 'it came bundled with my phone plan' },
    { code: C.international, phrase: 'shows from other countries' },
    { code: C.releases, phrase: 'new stuff comes out fast' },
    { code: C.satisfied, phrase: 'I just like it overall' },
];

// PRNG determinístico (Park–Miller) para a amostra ser sempre a mesma.
function makeRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function buildSample(): QcResponse[] {
    const random = makeRandom(20250925);
    const out: QcResponse[] = [];
    for (let n = 1; n <= 100; n++) {
        const id = `R-${String(n).padStart(4, '0')}`;
        const diff = DIFF_RESPONSES[n];
        if (diff) {
            out.push({ id, ...diff });
            continue;
        }
        if (n % 23 === 0) {
            out.push({ id, text: 'Not sure, nothing in particular.', manualCodes: [C.dontKnow], aiCodes: [C.dontKnow] });
            continue;
        }
        const count = 1 + Math.floor(random() * 3);
        const picked: { code: string; phrase: string }[] = [];
        while (picked.length < count) {
            const option = MATCHED_POOL[Math.floor(random() * MATCHED_POOL.length)];
            if (!picked.includes(option)) picked.push(option);
        }
        const sentence = picked.map((p) => p.phrase).join(', ');
        const codes = picked.map((p) => p.code);
        out.push({
            id,
            text: sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.',
            manualCodes: codes,
            aiCodes: [...codes],
        });
    }
    return out;
}

// Derivações ------------------------------------------------------------------

export function deriveResponse(r: QcResponse): QcDerivedResponse {
    const ai = new Set(r.aiCodes);
    const manual = new Set(r.manualCodes);
    const inBoth = r.manualCodes.filter((c) => ai.has(c));
    const onlyManual = r.manualCodes.filter((c) => !ai.has(c));
    const onlyAI = r.aiCodes.filter((c) => !manual.has(c));
    return { ...r, inBoth, onlyManual, onlyAI, hasDifference: onlyManual.length > 0 || onlyAI.length > 0 };
}

/** Amostra completa (100 respostas), já com as derivações. */
export const SAMPLE_RESPONSES: QcDerivedResponse[] = buildSample().map(deriveResponse);
