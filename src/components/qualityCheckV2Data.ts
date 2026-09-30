// -----------------------------------------------------------------------------
// qualityCheckV2Data — dados mockados do Quality Check (V1–V4 do
// QualityCheckPrototype: QualityCheckV2 e QualityCheckV3 leem daqui).
//
// Próprios de propósito: não reusa os mocks do painel antigo (QualityCheckPanel).
//
// Modelo: o codebook treinado usa os MESMOS codes do codebook de origem (só as
// regras são geradas). O QC roda o AI coder numa pergunta já codificada
// manualmente e compara, resposta a resposta, os codes manuais vs. os da AI —
// comparação determinística 1:1, sem LLM-as-judge.
//
// Codes: os labels abaixo são IDÊNTICOS aos do CODEBOOK_ROWS do
// AccountCodebookRulesModal (codebook de feedback de academia: limpeza,
// manutenção, experiência, staff e climatização). É o match por label que
// aplica a tag "Refined" nos codes do codebook após "Update code rules" — ao
// editar, mantenha os nomes em sincronia com aquele arquivo.
//
// Amostra: 100 respostas, 20 com diferença (match rate de 80%). As 20 são, na
// maioria, respostas longas e informais, com 1–4 codes de diferença cada,
// misturando "AI missed", "AI added" e os dois, com erros típicos de AI
// (Excessive heat vs. Inadequate cooling, Broken vs. Poor condition, menções
// passadas/positivas codificadas como problema, metáforas lidas ao pé da letra,
// sentimento). Também cobrem os casos de estresse do layout: uma resposta com
// 10 codes, nomes de code longos, uma resposta em que a AI não aplicou nenhum
// code e duas curtas. As outras 80 são geradas de forma determinística
// (manual = AI) só para alimentar as contagens (ex.: coluna "Manual coding
// (sample)" da visão By code).
// -----------------------------------------------------------------------------

export interface QcResponse {
    id: string;
    text: string;
    manualCodes: string[];
    aiCodes: string[];
}

/** Qual codificação o usuário marcou como correta numa resposta com diferença. */
export type QcDecision = 'manual' | 'ai';

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
    // Facility Cleanliness
    uncleanliness: 'General facility uncleanliness',
    lockerRooms: 'Locker rooms dirty',
    restrooms: 'Restrooms unhygienic',
    showers: 'Shower areas unsanitary',
    grimy: 'Equipment surfaces grimy',
    otherCleanliness: 'Other Facility Cleanliness',
    // Facility Infrastructure & Maintenance
    poorCondition: 'Equipment in poor condition',
    broken: 'Broken or malfunctioning equipment',
    structural: 'Structural damage and decay',
    hvac: 'HVAC and temperature problems',
    water: 'Water system issues',
    otherMaintenance: 'Other Facility Infrastructure & Maintenance',
    // Member Experience & Satisfaction
    positive: 'Positive overall experience',
    negative: 'Negative overall experience',
    returning: 'Returning member experience',
    firstImpressions: 'Facility first impressions',
    otherExperience: 'Other Member Experience & Satisfaction',
    // Staff Performance & Conduct
    absenteeism: 'Staff absenteeism',
    unhelpful: 'Unhelpful staff behavior',
    inattentive: 'Staff inattentiveness',
    unprofessional: 'Staff unprofessionalism',
    rude: 'Rude or dismissive staff',
    otherStaff: 'Other Staff Performance & Conduct',
    // Climate Control
    heat: 'Excessive heat',
    cold: 'Cold temperatures',
    airCirculation: 'Poor air circulation',
    cooling: 'Inadequate cooling',
    humidity: 'Excessive humidity',
    otherClimate: 'Other Climate Control',
} as const;

// Respostas com diferença (casos de estresse) ----------------------------------

const DIFF_RESPONSES: Record<number, Omit<QcResponse, 'id'>> = {
    // Menção passada (locker rooms já reformados) codificada pela AI.
    3: {
        text: 'The locker rooms used to be disgusting but they renovated them last year and now they’re fine. My real problem is the equipment — half the cable machines have frayed cables and the treadmill by the window has been out of order for a month.',
        manualCodes: [C.poorCondition, C.broken],
        aiCodes: [C.lockerRooms, C.poorCondition, C.broken, C.negative],
    },
    // Heat vs. cooling: a AI não separa o calor do AC que não dá conta.
    7: {
        text: 'It’s like a sauna in the cardio room every afternoon. The AC is clearly not keeping up.',
        manualCodes: [C.heat, C.cooling, C.hvac],
        aiCodes: [C.heat, C.hvac],
    },
    11: {
        text: 'The showers are never cleaned. There’s mold in the corners and hair in the drains every single time I go.',
        manualCodes: [C.showers],
        aiCodes: [C.showers, C.water, C.uncleanliness],
    },
    // A AI não aplicou nenhum code (typos e abreviações).
    14: {
        text: 'lockr room smells like a sewer n the bathrooms r nasty',
        manualCodes: [C.lockerRooms, C.restrooms],
        aiCodes: [],
    },
    19: {
        text: 'Honestly the staff are the worst part. The guy at the front desk barely looks up from his phone, I asked a trainer where the foam rollers were and he just shrugged and walked off, and half the time there’s nobody at the desk at all when I come in at 6am.',
        manualCodes: [C.inattentive, C.unhelpful, C.absenteeism, C.rude],
        aiCodes: [C.inattentive],
    },
    // Texto longo + 10 codes.
    23: {
        text:
            'Where do I even start. I was a member here for about three years, left for a while, and came back in January hoping things had improved. The first thing I noticed walking in was the smell — the whole place just feels dirty. The locker rooms are gross, the restrooms are worse, and the showers have had mold for months. The machines are sticky with sweat because nobody wipes them down and there are never any wipes. Two of the squat racks have been broken since I rejoined. The ceiling tiles over the stretching area are stained and sagging, which honestly makes me nervous. It’s also boiling in there in the summer and the air just doesn’t move. Overall it’s been a really disappointing return.',
        manualCodes: [
            C.uncleanliness, C.lockerRooms, C.restrooms, C.showers, C.grimy,
            C.broken, C.structural, C.heat, C.returning, C.negative,
        ],
        aiCodes: [
            C.uncleanliness, C.lockerRooms, C.restrooms, C.showers, C.grimy,
            C.broken, C.structural, C.heat, C.airCirculation, C.negative,
        ],
    },
    27: {
        text: 'Staff are friendly and the classes are great. My only complaint is that the pool is always freezing, even in the summer.',
        manualCodes: [C.positive, C.cold],
        aiCodes: [C.positive, C.cold, C.hvac],
    },
    // Nomes de code longos.
    31: {
        text: 'There’s a bunch of little things. The lockers don’t lock properly, the parking lot lights have been out for weeks, and the manager told me that wasn’t his problem when I mentioned it.',
        manualCodes: [C.otherMaintenance, C.otherStaff, C.rude],
        aiCodes: [C.otherMaintenance, C.unhelpful],
    },
    36: {
        text: 'Honestly one of the cleanest gyms I’ve been to. Staff wipe everything down constantly and the place looks brand new when you walk in.',
        manualCodes: [C.positive, C.firstImpressions],
        aiCodes: [C.positive],
    },
    40: {
        text: 'the water fountains have been broken for like two months so i have to buy water at the desk lol. also the hot water in the showers cuts out halfway thru. staff dont seem to care',
        manualCodes: [C.water, C.inattentive],
        aiCodes: [C.water, C.broken, C.showers, C.inattentive],
    },
    46: {
        text: 'It’s way too humid in the weight room, the mirrors fog up and the floor gets slippery. There’s clearly no ventilation back there.',
        manualCodes: [C.humidity, C.airCirculation],
        aiCodes: [C.humidity],
    },
    // Texto longo + metáfora ("cracks started to show") lida ao pé da letra.
    52: {
        text:
            'I’ve tried a lot of gyms in the area and this one made a great first impression — bright, modern, the equipment looked new. After a couple of months though the cracks started to show. The cardio machines constantly have “out of order” signs and the rowing machines are falling apart. I still like the atmosphere, but the maintenance really needs to catch up.',
        manualCodes: [C.firstImpressions, C.broken, C.poorCondition],
        aiCodes: [C.firstImpressions, C.broken, C.poorCondition, C.positive, C.structural],
    },
    57: {
        text: 'The heating in the yoga studio is broken, so the morning classes are freezing in winter. I told the front desk three times and nothing happened, and the instructor has cancelled class twice without notice.',
        manualCodes: [C.hvac, C.cold, C.unhelpful, C.absenteeism],
        aiCodes: [C.cold],
    },
    61: {
        text: 'Rude staff, dirty bathrooms, broken machines. Not worth the money.',
        manualCodes: [C.rude, C.restrooms, C.broken, C.negative],
        aiCodes: [C.rude, C.restrooms, C.poorCondition, C.negative],
    },
    68: {
        text: 'The roof leaks every time it rains and they just put a bucket under it. There’s also a weird damp smell by the pool.',
        manualCodes: [C.structural, C.otherCleanliness],
        aiCodes: [C.structural],
    },
    73: {
        text: 'Staff never there.',
        manualCodes: [C.absenteeism],
        aiCodes: [C.absenteeism, C.inattentive],
    },
    // Melhorias (menções positivas) codificadas como problemas.
    79: {
        text: 'I came back after two years away and it’s so much better now. New equipment, cleaner locker rooms, friendlier staff.',
        manualCodes: [C.returning, C.positive],
        aiCodes: [C.returning, C.positive, C.lockerRooms, C.poorCondition],
    },
    85: {
        text: 'too hot',
        manualCodes: [C.heat],
        aiCodes: [C.hvac],
    },
    90: {
        text: 'The trainers are great but the front desk team is really unprofessional — loud personal calls, eating at the desk, and gossiping about members where everyone can hear.',
        manualCodes: [C.unprofessional],
        aiCodes: [C.unprofessional, C.positive, C.rude],
    },
    96: {
        text: 'The AC has been broken all summer. It’s stuffy, it smells, and I’ve seen people nearly pass out in spin class. I’m cancelling my membership.',
        manualCodes: [C.hvac, C.cooling, C.airCirculation, C.negative],
        aiCodes: [C.hvac, C.heat, C.airCirculation, C.uncleanliness],
    },
};

// Respostas sem diferença (geradas) --------------------------------------------

// Pool e frases usadas para montar as respostas concordantes.
const MATCHED_POOL: { code: string; phrase: string }[] = [
    { code: C.lockerRooms, phrase: 'the locker rooms are dirty' },
    { code: C.restrooms, phrase: 'the restrooms are unhygienic' },
    { code: C.showers, phrase: 'the showers are gross' },
    { code: C.grimy, phrase: 'the machines are sticky and grimy' },
    { code: C.broken, phrase: 'half the treadmills are broken' },
    { code: C.poorCondition, phrase: 'the equipment is old and worn out' },
    { code: C.structural, phrase: 'there are leaks in the ceiling' },
    { code: C.water, phrase: 'the water fountains never work' },
    { code: C.heat, phrase: 'it is way too hot inside' },
    { code: C.cold, phrase: 'the pool area is freezing' },
    { code: C.airCirculation, phrase: 'the air feels stale' },
    { code: C.humidity, phrase: 'it is really humid in the weights area' },
    { code: C.rude, phrase: 'the front desk staff are rude' },
    { code: C.absenteeism, phrase: 'nobody is ever at the front desk' },
    { code: C.inattentive, phrase: 'trainers are on their phones instead of watching the floor' },
    { code: C.unhelpful, phrase: 'staff won’t help with simple questions' },
    { code: C.positive, phrase: 'overall I love this gym' },
    { code: C.negative, phrase: 'honestly it is a disappointing experience' },
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
            out.push({ id, text: 'It’s a gym, it does the job.', manualCodes: [C.otherExperience], aiCodes: [C.otherExperience] });
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
