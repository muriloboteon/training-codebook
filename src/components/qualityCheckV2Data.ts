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
// Codes: os labels abaixo são IDÊNTICOS aos do CODEBOOK_ROWS do
// AccountCodebookRulesModal (codebook de compras/delivery). É o match por label
// que aplica a tag "Refined" nos codes do codebook após "Update code rules" —
// ao editar, mantenha os nomes em sincronia com aquele arquivo.
//
// Amostra: 100 respostas, 20 com diferença (match rate de 80%). As 20 são, na
// maioria, respostas longas e informais, com 1–4 codes de diferença cada,
// misturando "AI missed", "AI added" e os dois, com erros típicos de AI
// (Amazon vs. Amazon Fresh/Prime, Uber vs. Uber Eats, typos de marca, menções
// negativas/passadas codificadas, sentimento). Também cobrem os casos de
// estresse do layout: uma resposta com 10 codes, nomes de code longos, uma
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
    text: 'Q4. Where do you usually shop for groceries, and why?',
};

// Codes do codebook (mesmos labels do AccountCodebookRulesModal) --------------

const C = {
    amazon: 'Amazon',
    amazonFresh: 'Amazon Fresh',
    prime: 'Amazon Prime',
    walmartPlus: 'Walmart+',
    walmart: 'Walmart',
    target: 'Target',
    kroger: 'Kroger',
    aldi: 'Aldi',
    publix: 'Publix',
    wegmans: 'Wegmans',
    safeway: 'Safeway',
    costco: 'Costco',
    sams: "Sam's Club",
    bjs: "BJ's",
    wholeFoods: 'Whole Foods',
    traderJoes: "Trader Joe's",
    sprouts: 'Sprouts',
    hmart: 'H-Mart',
    instacart: 'Instacart',
    peapod: 'Peapod',
    freshDirect: 'FreshDirect',
    shipt: 'Shipt',
    uberEats: 'Uber Eats',
    doordash: 'DoorDash',
    grubhub: 'GrubHub',
    uber: 'Uber',
    gopuff: 'GoPuff',
    shoprite: 'Shoprite',
    stopShop: 'Stop & Shop',
    giant: 'Giant',
    gristedes: 'Gristedes',
    dollarTree: 'Dollar Tree',
    dollarGeneral: 'Dollar General',
    riteAid: 'Rite Aid',
    lidl: 'Lidl',
    positiveExcellent: 'Positive sentiment - excellent or very good',
    positiveGood: 'Positive sentiment - good or like',
    okay: 'Okay or acceptable',
    noPref: 'No preference',
    cantRecall: 'Cannot recall or specify',
    nonResponse: 'Non-response or unclear',
} as const;

// Respostas com diferença (casos de estresse) ----------------------------------

const DIFF_RESPONSES: Record<number, Omit<QcResponse, 'id'>> = {
    // Menção passada/negativa (Stop & Shop) codificada pela AI.
    3: {
        text: 'Mostly Aldi and Lidl, they’re both like ten minutes from my house and way cheaper than the big chains. I used to go to Stop & Shop every week but the prices got ridiculous. Every couple of months I’ll do a Costco run with my sister because she has the membership.',
        manualCodes: [C.aldi, C.lidl, C.costco],
        aiCodes: [C.aldi, C.stopShop, C.costco, C.positiveGood],
    },
    7: {
        text: 'Amazon Fresh for the heavy stuff like water and cat litter, it gets delivered same day with my Prime membership. For everything else I just walk to Trader Joe’s.',
        manualCodes: [C.amazonFresh, C.prime, C.traderJoes],
        aiCodes: [C.amazon, C.prime, C.traderJoes],
    },
    11: {
        text: 'Walmart. It’s close, it’s cheap and it has everything in one place so I don’t have to make three stops with two kids in the car.',
        manualCodes: [C.walmart],
        aiCodes: [C.walmart, C.walmartPlus, C.positiveGood],
    },
    // A AI não aplicou nenhum code (typos de marca).
    14: {
        text: 'wallmart and aldis mostly lol',
        manualCodes: [C.walmart, C.aldi],
        aiCodes: [],
    },
    19: {
        text: 'Honestly I barely go inside a store anymore. Instacard does most of my weekly order from Wegmans, and if I forget something I’ll get it through GoPuff at like 11pm. Doordash for dinner when I’m too tired to cook.',
        manualCodes: [C.instacart, C.wegmans, C.gopuff, C.doordash],
        aiCodes: [C.wegmans],
    },
    // Texto longo + 10 codes.
    23: {
        text:
            'Where do I even start. Weekly groceries are split between Kroger and Aldi depending on what’s on sale, and I go to Whole Foods for meat and fish because the quality is just better. Trader Joe’s for snacks and frozen stuff, obviously. Once a month we do a big bulk run at Costco, and my husband insists on Sam’s Club for his protein bars even though I keep telling him it’s the same thing. When nobody has time to go out I order from Instacart, and Amazon Fresh has been a lifesaver for the heavy stuff like water and paper towels. For last-minute things there’s a Dollar General right by my kid’s school. Overall I’m really happy with the options we have around here, it’s honestly great.',
        manualCodes: [
            C.kroger, C.aldi, C.wholeFoods, C.traderJoes, C.costco,
            C.sams, C.instacart, C.amazonFresh, C.dollarGeneral, C.positiveExcellent,
        ],
        aiCodes: [
            C.kroger, C.aldi, C.wholeFoods, C.traderJoes, C.costco,
            C.sams, C.amazonFresh, C.dollarGeneral, C.amazon, C.positiveGood,
        ],
    },
    // Serviço que o respondente cancelou, codificado pela AI.
    27: {
        text: 'Target for household stuff and whatever groceries I remember while I’m there. I tried Shipt for a while but the substitutions drove me crazy so I canceled it.',
        manualCodes: [C.target],
        aiCodes: [C.target, C.shipt],
    },
    // Nomes de code longos.
    31: {
        text: 'I don’t really remember, whatever is closest when I need something. It’s fine I guess, nothing special about any of them.',
        manualCodes: [C.cantRecall, C.noPref, C.okay],
        aiCodes: [C.nonResponse, C.okay],
    },
    36: {
        text: 'Publix. The subs are the best and the staff are always super nice, I wouldn’t shop anywhere else.',
        manualCodes: [C.publix, C.positiveExcellent],
        aiCodes: [C.publix, C.positiveExcellent, C.positiveGood],
    },
    40: {
        text: 'mostly shoprite bc its the closest, sometimes stop n shop if theres a sale. my mom still orders from peapod every week which i think is funny. we used to get uber eats a lot but its way too expensive now',
        manualCodes: [C.shoprite, C.stopShop, C.peapod],
        aiCodes: [C.shoprite, C.peapod, C.uberEats, C.uber],
    },
    46: {
        text: 'We have a Giant right down the street and I use their Giant peapod delivery when the weather is bad. Sometimes Safeway if I’m near my office.',
        manualCodes: [C.giant, C.peapod, C.safeway],
        aiCodes: [C.giant, C.safeway],
    },
    // Texto longo.
    52: {
        text:
            'I’m very particular about organic produce so it’s mostly Sprouts and Whole Foods for me. The prices at Whole Foods got a bit better after the Amazon thing, and I get free delivery through my Prime account, which is great when I’m busy with work. I’d say the quality at both is excellent, and the staff at Sprouts know me by name at this point.',
        manualCodes: [C.sprouts, C.wholeFoods, C.prime, C.positiveExcellent],
        aiCodes: [C.sprouts, C.wholeFoods, C.prime, C.positiveExcellent, C.amazon, C.amazonFresh],
    },
    57: {
        text: 'H-Mart for all the Korean groceries I can’t find anywhere else, and Cosco for rice and meat in bulk. My parents still go to a small store in Flushing but I don’t know the name. BJ’s sometimes because it’s closer, but the selection is worse.',
        manualCodes: [C.hmart, C.costco, C.bjs, C.cantRecall],
        aiCodes: [C.hmart],
    },
    61: {
        text: 'Dollar Tree and Dollar General for most things, and Walmart+ delivery when I need bigger stuff. Money is tight so I go wherever is cheapest.',
        manualCodes: [C.dollarTree, C.dollarGeneral, C.walmartPlus],
        aiCodes: [C.dollarTree, C.dollarGeneral, C.walmart, C.noPref],
    },
    68: {
        text: 'FreshDirect! I live in a fourth floor walk-up in Manhattan, there is no way I’m carrying groceries up those stairs. Gristedes on the corner for emergencies.',
        manualCodes: [C.freshDirect, C.gristedes],
        aiCodes: [C.freshDirect],
    },
    73: {
        text: 'Costco. Everything else is too expensive for a family of six.',
        manualCodes: [C.costco],
        aiCodes: [C.costco, C.bjs],
    },
    79: {
        text: 'I order almost everything on Amazon now, even groceries. It’s just easier than going out with a newborn.',
        manualCodes: [C.amazon],
        aiCodes: [C.amazon, C.amazonFresh, C.prime],
    },
    85: {
        text: 'idk',
        manualCodes: [C.nonResponse],
        aiCodes: [C.cantRecall],
    },
    90: {
        text: 'We split it: Kroger for the weekly stuff, Target for household items, and Rite Aid for prescriptions and snacks since it’s on the way home. Every now and then GrubHub when nobody wants to cook.',
        manualCodes: [C.kroger, C.target, C.riteAid, C.grubhub],
        aiCodes: [C.kroger, C.target],
    },
    96: {
        text: 'Lidl opened near us last year and it’s honestly great, I switched from Safeway almost completely. I still take an Uber to get there since I don’t drive, and sometimes I’ll just order Uber Eats from the deli next door.',
        manualCodes: [C.lidl, C.positiveExcellent, C.uberEats],
        aiCodes: [C.lidl, C.positiveGood, C.safeway, C.uber, C.uberEats],
    },
};

// Respostas sem diferença (geradas) --------------------------------------------

// Pool e frases usadas para montar as respostas concordantes.
const MATCHED_POOL: { code: string; phrase: string }[] = [
    { code: C.walmart, phrase: 'Walmart because it is close' },
    { code: C.target, phrase: 'Target for household stuff' },
    { code: C.kroger, phrase: 'Kroger for the weekly groceries' },
    { code: C.aldi, phrase: 'Aldi because it is cheap' },
    { code: C.publix, phrase: 'Publix' },
    { code: C.wegmans, phrase: 'Wegmans' },
    { code: C.safeway, phrase: 'Safeway near my office' },
    { code: C.costco, phrase: 'Costco for bulk' },
    { code: C.sams, phrase: 'Sam’s Club once a month' },
    { code: C.wholeFoods, phrase: 'Whole Foods for produce' },
    { code: C.traderJoes, phrase: 'Trader Joe’s for snacks' },
    { code: C.instacart, phrase: 'Instacart when I am busy' },
    { code: C.amazonFresh, phrase: 'Amazon Fresh deliveries' },
    { code: C.shoprite, phrase: 'ShopRite' },
    { code: C.dollarGeneral, phrase: 'Dollar General for quick stuff' },
    { code: C.doordash, phrase: 'DoorDash for takeout' },
    { code: C.lidl, phrase: 'Lidl' },
    { code: C.sprouts, phrase: 'Sprouts for organic stuff' },
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
            out.push({ id, text: 'Not sure, nothing in particular.', manualCodes: [C.cantRecall], aiCodes: [C.cantRecall] });
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
