import { useState } from 'react';
import { color, font, radius } from '../tokens';
import type { TrainingQuestion } from './RecreateCodebookModal';
import QualityCheckV2 from './QualityCheckV2';
import QualityCheckV3 from './QualityCheckV3';
import type { QcDecision } from './qualityCheckV2Data';

// -----------------------------------------------------------------------------
// QualityCheckPrototype — TEMPORÁRIO: alterna entre o layout atual do Quality
// Check (QualityCheckV2) e o layout proposto (QualityCheckV3, lista densa
// voltada para escaneabilidade) por um switch no header, para comparar as duas
// com a PM. O switch é só do protótipo (amarelo, como o PrototypeNav).
//
// As decisões por resposta ficam aqui, então sobrevivem à troca de layout. A
// semântica de "ausente" difere: na V2 ausente = Manual (default); na V3
// ausente = ainda não revisada.
//
// Para remover a V3: renderizar QualityCheckV2 direto no
// AccountCodebookRulesModal (com o estado de decisões) e apagar este arquivo e
// o QualityCheckV3.
// -----------------------------------------------------------------------------

type Layout = 'current' | 'proposed';

interface QualityCheckPrototypeProps {
    isOpen: boolean;
    sampleQuestion: TrainingQuestion | null;
    onUpdateRules: (codesToRefine: string[]) => void;
    onKeepRules: () => void;
    onCancel: () => void;
}

function QualityCheckPrototype(props: QualityCheckPrototypeProps) {
    const [layout, setLayout] = useState<Layout>('current');
    const [decisions, setDecisions] = useState<Record<string, QcDecision>>({});

    const layoutSwitch = <LayoutSwitch value={layout} onChange={setLayout} />;

    return layout === 'current' ? (
        <QualityCheckV2 {...props} decisions={decisions} onDecisionsChange={setDecisions} headerExtra={layoutSwitch} />
    ) : (
        <QualityCheckV3 {...props} decisions={decisions} onDecisionsChange={setDecisions} headerExtra={layoutSwitch} />
    );
}

function LayoutSwitch({ value, onChange }: { value: Layout; onChange: (v: Layout) => void }) {
    const options: { value: Layout; label: string }[] = [
        { value: 'current', label: 'V1' },
        { value: 'proposed', label: 'V2' },
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
