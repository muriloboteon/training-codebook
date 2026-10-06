import { useState } from 'react';
import { color, font, radius } from '../tokens';
import type { TrainingQuestion } from './RecreateCodebookModal';
import QualityCheckV2 from './QualityCheckV2';
import QualityCheckV3, { type CodeColumns } from './QualityCheckV3';
import type { QcDecision } from './qualityCheckV2Data';

// -----------------------------------------------------------------------------
// QualityCheckPrototype — TEMPORÁRIO: alterna entre layouts do Quality Check
// por um switch no header ("Prototype layout: V1 … V4"), para comparar
// com a PM. O switch é só do protótipo (amarelo, como o PrototypeNav).
//
//   V1 → QualityCheckV2 (layout atual, cards por resposta).
//   V2 → QualityCheckV3 codeColumns="diff"  (lista densa, coluna Differences).
//   V3 → QualityCheckV3 codeColumns="split" (lista densa, colunas Matched in
//        both · Only in manual coding · Only in AI coding).
//   V4 → QualityCheckV3 codeColumns="stacked" (os mesmos três grupos, abaixo
//        do texto de cada resposta).
//
// As decisões por resposta ficam aqui, então sobrevivem à troca de layout. Em
// todas as versões, ausente = Manual (default, feedback da PM).
//
// DECISÃO: seguimos com a V3 (QualityCheckV3 codeColumns="split"). É a única
// versão a implementar. V1, V2 e V4 foram descartadas e só continuam no código
// para eventual comparação com a PM: o switch está OCULTO (SHOW_LAYOUT_SWITCH)
// e o layout fixo em V3. Para reexibir, ligue SHOW_LAYOUT_SWITCH.
// -----------------------------------------------------------------------------

type Layout = 'v1' | 'v2' | 'v3' | 'v4';

// Switch "Prototype layout" oculto: a V3 é a versão escolhida.
const SHOW_LAYOUT_SWITCH = false;

// Layout → modo de colunas do QualityCheckV3 (V2 em diante).
const CODE_COLUMNS: Record<Exclude<Layout, 'v1'>, CodeColumns> = {
    v2: 'diff',
    v3: 'split',
    v4: 'stacked',
};

interface QualityCheckPrototypeProps {
    isOpen: boolean;
    sampleQuestion: TrainingQuestion | null;
    onUpdateRules: (codesToRefine: string[]) => void;
    onKeepRules: () => void;
    onCancel: () => void;
}

function QualityCheckPrototype(props: QualityCheckPrototypeProps) {
    const [layout, setLayout] = useState<Layout>('v3');
    const [decisions, setDecisions] = useState<Record<string, QcDecision>>({});

    const layoutSwitch = SHOW_LAYOUT_SWITCH ? <LayoutSwitch value={layout} onChange={setLayout} /> : undefined;

    return layout === 'v1' ? (
        <QualityCheckV2 {...props} decisions={decisions} onDecisionsChange={setDecisions} headerExtra={layoutSwitch} />
    ) : (
        <QualityCheckV3
            {...props}
            decisions={decisions}
            onDecisionsChange={setDecisions}
            headerExtra={layoutSwitch}
            codeColumns={CODE_COLUMNS[layout]}
        />
    );
}

function LayoutSwitch({ value, onChange }: { value: Layout; onChange: (v: Layout) => void }) {
    const options: { value: Layout; label: string }[] = [
        { value: 'v1', label: 'V1' },
        { value: 'v2', label: 'V2' },
        { value: 'v3', label: 'V3' },
        { value: 'v4', label: 'V4' },
    ];
    return (
        <div role="group" aria-label="Prototype layout" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: font.size.sm, color: color.textMuted, whiteSpace: 'nowrap' }}>Prototype layout</span>
            <div style={{ display: 'inline-flex', gap: '2px', padding: '2px', backgroundColor: color.tabTrack, borderRadius: radius.md }}>
                {options.map((o) => {
                    const active = o.value === value;
                    return (
                        <button
                            key={o.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onChange(o.value)}
                            style={{
                                height: '24px',
                                padding: '0 10px',
                                border: 'none',
                                borderRadius: radius.sm,
                                backgroundColor: active ? color.protoAccent : 'transparent',
                                color: active ? color.protoAccentText : color.textMuted,
                                fontFamily: font.family,
                                fontSize: font.size.sm,
                                fontWeight: active ? font.weight.semibold : font.weight.medium,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                            }}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default QualityCheckPrototype;
