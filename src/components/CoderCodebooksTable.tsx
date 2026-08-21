import React, { useState } from 'react';
import { ArrowBendUpRight, LinkBreak, ListChecks, Columns, MagicWand } from '@phosphor-icons/react';
import { color, font, radius, space } from '../tokens';
import TrainCodebookModal from './TrainCodebookModal';

interface Codebook {
    id: string;
    codebookId: string;
    description: string;
    notes: string;
    length: number;
    sharedQuestions: number;
    noDuplicateOutputIds: boolean;
    spreadBetweenCodes: number;
    masterCodebook: boolean;
}

const codebooksData: Codebook[] = [
    {
        id: "1",
        codebookId: "Exemple plan de code client",
        description: "",
        notes: "",
        length: 2,
        sharedQuestions: 0,
        noDuplicateOutputIds: false,
        spreadBetweenCodes: 1,
        masterCodebook: false
    },
    {
        id: "2",
        codebookId: "NPSGrpCBK",
        description: "Master NPS Grouping codebook",
        notes: "",
        length: 3,
        sharedQuestions: 0,
        noDuplicateOutputIds: false,
        spreadBetweenCodes: 100,
        masterCodebook: true
    },
    {
        id: "3",
        codebookId: "SentCBK",
        description: "Master Sentiment Rating",
        notes: "",
        length: 5,
        sharedQuestions: 0,
        noDuplicateOutputIds: false,
        spreadBetweenCodes: 100,
        masterCodebook: true
    }
];

// Row Action Icons (visible on hover) — redirect, delete, checklist, columns
function RowActionIcons({ isVisible, onTrain }: { isVisible: boolean; onTrain: () => void }) {
    const iconButtonStyle: React.CSSProperties = {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: space.xs,
        borderRadius: radius.sm,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.15s ease"
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: space.xs,
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.15s ease",
            pointerEvents: isVisible ? "auto" : "none"
        }}>
            {/* Redirect/Link icon - Blue */}
            <button
                type="button"
                aria-label="Details"
                title="Details"
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.infoSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <ArrowBendUpRight size={18} weight="bold" color={color.info} />
            </button>

            {/* Unshare icon - Red */}
            <button
                type="button"
                aria-label="Unshare"
                title="Unshare"
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.dangerSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <LinkBreak size={18} weight="bold" color={color.danger} />
            </button>

            {/* Checklist icon - Teal */}
            <button
                type="button"
                aria-label="Coder"
                title="Coder"
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.brandSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <ListChecks size={18} weight="bold" color={color.brand} />
            </button>

            {/* Columns icon - Purple */}
            <button
                type="button"
                aria-label="Dual codebooks"
                title="Dual codebooks"
                style={iconButtonStyle}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.brandSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <Columns size={18} weight="bold" color={color.brand} />
            </button>

            {/* Train Codebook */}
            <button
                type="button"
                aria-label="Train Codebook"
                title="Train Codebook"
                style={iconButtonStyle}
                onClick={(e) => { e.stopPropagation(); onTrain(); }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.brandSoft;
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
            >
                <MagicWand size={18} weight="bold" color={color.brand} />
            </button>
        </div>
    );
}

// Read-only checkbox used for the boolean columns (matches the disabled look in the reference)
function ReadOnlyCheckbox({ checked }: { checked: boolean }) {
    return (
        <input
            type="checkbox"
            checked={checked}
            readOnly
            disabled
            style={{
                width: "16px",
                height: "16px",
                accentColor: color.brand,
                margin: 0,
                verticalAlign: "middle",
                cursor: "default"
            }}
        />
    );
}

function CoderCodebooksTable({ searchQuery = '' }: { searchQuery?: string }) {
    const [codebooks] = useState(codebooksData);
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
    const [trainCodebookName, setTrainCodebookName] = useState<string | null>(null);

    const filteredData = codebooks.filter(cb => {
        const matchesSearch = !searchQuery ||
            cb.codebookId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cb.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Header styles
    const groupHeaderStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        textAlign: "left",
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textHeaderGroup,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: `1px solid ${color.border}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        backgroundColor: color.surfaceSubtle,
        whiteSpace: "nowrap"
    };

    const columnHeaderStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        textAlign: "left",
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: color.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        borderBottom: `1px solid ${color.border}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        backgroundColor: color.surfaceSubtle,
        whiteSpace: "nowrap"
    };

    const tableCellStyle: React.CSSProperties = {
        padding: `${space.sm} ${space.md}`,
        fontSize: font.size.md,
        color: color.text,
        borderBottom: `1px solid ${color.surfaceHover}`,
        borderRight: `1px solid ${color.borderSubtle}`,
        whiteSpace: "nowrap"
    };

    return (
        <>
        <div style={{
            fontFamily: font.family,
            width: "100%",
            border: `1px solid ${color.border}`,
            borderRadius: radius.lg,
            overflow: "auto",
            backgroundColor: color.surface
        }}>
            <table style={{
                width: "100%",
                minWidth: "1200px",
                borderCollapse: "collapse"
            }}>
                <thead>
                    {/* Row 1 - Group Headers */}
                    <tr>
                        <th style={{ ...groupHeaderStyle, width: "7%" }}>ACTION</th>
                        <th colSpan={8} style={{ ...groupHeaderStyle, width: "90%", borderRight: "none" }}>CODEBOOKS</th>
                    </tr>
                    {/* Row 2 - Column Headers */}
                    <tr>
                        <th style={{ ...columnHeaderStyle }}>BUTTONS</th>
                        <th style={{ ...columnHeaderStyle }}>ID</th>
                        <th style={{ ...columnHeaderStyle }}>DESCRIPTION</th>
                        <th style={{ ...columnHeaderStyle }}>NOTES</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>LENGTH</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>SHARED QUESTIONS</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>NO DUPLICATE OUTPUTIDS</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right" }}>SPREAD BETWEEN CODES</th>
                        <th style={{ ...columnHeaderStyle, textAlign: "right", borderRight: "none" }}>MASTER CODEBOOK</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((cb, index) => {
                        const cellStyle = tableCellStyle;
                        return (
                        <tr
                            key={cb.id}
                            style={{
                                backgroundColor: index % 2 === 0 ? color.surface : color.surfaceMuted,
                                cursor: "pointer",
                                transition: "background-color 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                                setHoveredRowId(cb.id);
                                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = color.surfaceHover;
                            }}
                            onMouseLeave={(e) => {
                                setHoveredRowId(null);
                                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = index % 2 === 0 ? color.surface : color.surfaceMuted;
                            }}
                        >
                            {/* ACTION - BUTTONS */}
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                                <RowActionIcons
                                    isVisible={hoveredRowId === cb.id}
                                    onTrain={() => setTrainCodebookName(cb.codebookId)}
                                />
                            </td>
                            {/* CODEBOOKS - ID */}
                            <td style={cellStyle}>
                                {cb.codebookId}
                            </td>
                            {/* CODEBOOKS - DESCRIPTION */}
                            <td style={cellStyle}>
                                {cb.description}
                            </td>
                            {/* CODEBOOKS - NOTES */}
                            <td style={cellStyle}>
                                {cb.notes}
                            </td>
                            {/* CODEBOOKS - LENGTH */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {cb.length}
                            </td>
                            {/* CODEBOOKS - SHARED QUESTIONS */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {cb.sharedQuestions}
                            </td>
                            {/* CODEBOOKS - NO DUPLICATE OUTPUTIDS */}
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                                <ReadOnlyCheckbox checked={cb.noDuplicateOutputIds} />
                            </td>
                            {/* CODEBOOKS - SPREAD BETWEEN CODES */}
                            <td style={{ ...cellStyle, textAlign: "right" }}>
                                {cb.spreadBetweenCodes}
                            </td>
                            {/* CODEBOOKS - MASTER CODEBOOK */}
                            <td style={{ ...cellStyle, textAlign: "center", borderRight: "none" }}>
                                <ReadOnlyCheckbox checked={cb.masterCodebook} />
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <TrainCodebookModal
            isOpen={trainCodebookName !== null}
            onClose={() => setTrainCodebookName(null)}
            sourceCodebookName={trainCodebookName ?? ''}
        />
        </>
    );
}

export default CoderCodebooksTable;
