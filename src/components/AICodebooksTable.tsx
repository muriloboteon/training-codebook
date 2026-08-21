import React, { useEffect, useMemo, useState } from 'react';
import { ArrowBendUpRight, Trash } from '@phosphor-icons/react';
import { color, font, radius, space } from '../tokens';

interface AICodebook {
    id: string;
    date: string;
    codes: number;
    applyRegex: boolean;
    applyTraining: boolean;
    applyCoding: boolean;
    sourceId: string;
    trained: boolean;
    gai: boolean;
}

const aiCodebooksData: AICodebook[] = [
    { id: 'Soproten Barometre', date: '09/07/2026', codes: 37, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'Soproten Barometre: Sur quels critères', trained: false, gai: true },
    { id: 'PDC Gustav', date: '26/06/2026', codes: 34, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'PDC CSA Juin26: Q1r1 + 9 Shared Questions', trained: true, gai: true },
    { id: 'TestStefiInformatique_1805: Q4', date: '05/06/2026', codes: 85, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'TestStefiInformatique_1805: Q4. Can you explain?', trained: true, gai: true },
    { id: 'Fiamma Test', date: '20/05/2026', codes: 85, applyRegex: false, applyTraining: false, applyCoding: true, sourceId: 'Fiamma - TestStefi: Q4. Can you explain?', trained: true, gai: true },
    { id: 'LR TestStefiInformatique_1805: Q4', date: '20/05/2026', codes: 85, applyRegex: false, applyTraining: false, applyCoding: true, sourceId: 'TestStefiInformatique_1805: Q4. Can you explain?', trained: true, gai: true },
    { id: 'Test AI_3 - Murilo: Q9', date: '14/04/2026', codes: 36, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'Test AI_3 - Murilo: Q9', trained: false, gai: true },
    { id: 'Murilo - Hair study', date: '06/04/2026', codes: 38, applyRegex: false, applyTraining: false, applyCoding: true, sourceId: 'Murilo - 110625: Q7', trained: false, gai: true },
    { id: 'Q6', date: '30/03/2026', codes: 28, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'Demo Stefi Informatique: Q6. You have mentioned', trained: true, gai: true },
    { id: 'Murilo', date: '02/03/2026', codes: 15, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'Test AI - Murilo: Comments', trained: false, gai: true },
    { id: 'Murilo - Test', date: '27/02/2026', codes: 38, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'Murilo - 110625: Q7', trained: false, gai: true },
    { id: 'My Restaurant Codebook', date: '15/12/2025', codes: 25, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: '87878: How was the quality of service?', trained: false, gai: true },
    { id: 'Solution&CO', date: '22/05/2025', codes: 44, applyRegex: false, applyTraining: true, applyCoding: true, sourceId: 'Demo Solutions&Co: O_Q13', trained: false, gai: true },
];

function ReadOnlyCheckbox({ checked }: { checked: boolean }) {
    return <input type="checkbox" checked={checked} readOnly disabled style={{ width: '16px', height: '16px', margin: 0, verticalAlign: 'middle', accentColor: color.brand }} />;
}

function RowActionIcons({ isVisible }: { isVisible: boolean }) {
    const iconButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: space.xs,
        borderRadius: radius.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.15s ease',
    };

    const actions = [
        { label: 'Open codebook', icon: ArrowBendUpRight, foreground: color.info, background: color.infoSoft },
        { label: 'Delete codebook', icon: Trash, foreground: color.danger, background: color.dangerSoft },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space.xs, opacity: isVisible ? 1 : 0, transition: 'opacity 0.15s ease', pointerEvents: isVisible ? 'auto' : 'none' }}>
            {actions.map(({ label, icon: Icon, foreground, background }) => (
                <button
                    key={label}
                    type="button"
                    aria-label={label}
                    title={label}
                    style={iconButtonStyle}
                    onClick={(event) => event.stopPropagation()}
                    onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = background; }}
                    onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                    <Icon size={18} weight="bold" color={foreground} />
                </button>
            ))}
        </div>
    );
}

interface AICodebooksTableProps {
    searchQuery?: string;
    onSelectionChange?: (count: number) => void;
}

function AICodebooksTable({ searchQuery = '', onSelectionChange }: AICodebooksTableProps) {
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

    useEffect(() => {
        onSelectionChange?.(selectedRowId ? 1 : 0);
    }, [selectedRowId, onSelectionChange]);

    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return aiCodebooksData;
        return aiCodebooksData.filter((codebook) =>
            codebook.id.toLowerCase().includes(query) ||
            codebook.date.includes(query) ||
            codebook.sourceId.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const groupHeaderStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        textAlign: 'left',
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textHeaderGroup,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: `1px solid ${color.border}`,
        backgroundColor: color.surfaceSubtle,
        whiteSpace: 'nowrap',
    };

    const columnHeaderStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        textAlign: 'left',
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        borderBottom: `1px solid ${color.border}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        backgroundColor: color.surfaceSubtle,
        whiteSpace: 'nowrap',
    };

    const tableCellStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        fontSize: font.size.md,
        color: color.text,
        borderBottom: `1px solid ${color.surfaceHover}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };

    return (
        <div style={{ width: '100%', border: `1px solid ${color.border}`, borderRadius: radius.lg, overflow: 'auto', backgroundColor: color.surface, fontFamily: font.family }}>
            <table style={{ width: '100%', minWidth: '1250px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        <th style={{ ...groupHeaderStyle, width: '90px', borderRight: `1px solid ${color.borderSubtle}` }}>ACTION</th>
                        <th colSpan={9} style={groupHeaderStyle}>CODEBOOKS</th>
                    </tr>
                    <tr>
                        <th style={{ ...columnHeaderStyle, width: '90px', textAlign: 'center' }}>BUTTONS</th>
                        <th style={{ ...columnHeaderStyle, width: '230px' }}>ID</th>
                        <th style={{ ...columnHeaderStyle, width: '110px', textAlign: 'center' }}>DATE</th>
                        <th style={{ ...columnHeaderStyle, width: '80px', textAlign: 'center' }}>CODES</th>
                        <th style={{ ...columnHeaderStyle, width: '110px', textAlign: 'center' }}>APPLY REGEX</th>
                        <th style={{ ...columnHeaderStyle, width: '125px', textAlign: 'center' }}>APPLY TRAINING</th>
                        <th style={{ ...columnHeaderStyle, width: '115px', textAlign: 'center' }}>APPLY CODING</th>
                        <th style={{ ...columnHeaderStyle, width: '290px' }}>SOURCE ID</th>
                        <th style={{ ...columnHeaderStyle, width: '100px', textAlign: 'center' }}>TRAINED</th>
                        <th style={{ ...columnHeaderStyle, width: '80px', textAlign: 'center', borderRight: 'none' }}>GAI</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((codebook, index) => {
                        const isSelected = selectedRowId === codebook.id;
                        return (
                            <tr
                                key={codebook.id}
                                onClick={() => setSelectedRowId(isSelected ? null : codebook.id)}
                                style={{ backgroundColor: isSelected ? color.border : index % 2 === 0 ? color.surface : color.surfaceMuted, cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                                onMouseEnter={(event) => {
                                    setHoveredRowId(codebook.id);
                                    if (!isSelected) event.currentTarget.style.backgroundColor = color.surfaceHover;
                                }}
                                onMouseLeave={(event) => {
                                    setHoveredRowId(null);
                                    if (!isSelected) event.currentTarget.style.backgroundColor = index % 2 === 0 ? color.surface : color.surfaceMuted;
                                }}
                            >
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}><RowActionIcons isVisible={hoveredRowId === codebook.id} /></td>
                                <td style={tableCellStyle} title={codebook.id}>{codebook.id}</td>
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}>{codebook.date}</td>
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}>{codebook.codes}</td>
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}><ReadOnlyCheckbox checked={codebook.applyRegex} /></td>
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}><ReadOnlyCheckbox checked={codebook.applyTraining} /></td>
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}><ReadOnlyCheckbox checked={codebook.applyCoding} /></td>
                                <td style={tableCellStyle} title={codebook.sourceId}>{codebook.sourceId}</td>
                                <td style={{ ...tableCellStyle, textAlign: 'center' }}><ReadOnlyCheckbox checked={codebook.trained} /></td>
                                <td style={{ ...tableCellStyle, textAlign: 'center', borderRight: 'none' }}><ReadOnlyCheckbox checked={codebook.gai} /></td>
                            </tr>
                        );
                    })}
                    {filteredData.length === 0 && (
                        <tr><td colSpan={10} style={{ ...tableCellStyle, padding: space.xl, textAlign: 'center', color: color.textMuted, borderRight: 'none' }}>No codebooks found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AICodebooksTable;
