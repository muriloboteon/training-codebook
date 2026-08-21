import { useEffect, useReducer, useRef, useState } from 'react';
import './validatorCodesModal.css';

// -----------------------------------------------------------------------------
// ValidatorCodesModal — port do "modal de codes" da tela AI Coder do Ascribe
// (originalmente #aiCoder-dialog-prompt-multiline / CodebookDialog +
// CodebookEditor no projeto de referência "Validator").
//
// Recurso SÓ de protótipo/validação — não faz parte do produto real. O markup e
// as classes espelham o export original; o CSS foi portado para
// validatorCodesModal.css. Os ícones SVG estão inline aqui para o componente
// ficar autossuficiente (a pasta Validator de referência será removida).
//
// Estático: os botões e campos são apenas visuais, sem fluxo conectado.
// -----------------------------------------------------------------------------

interface ValidatorCodesModalProps {
    onClose?: () => void;
}

// Ícones (portados dos SVGs FontAwesome do export) -----------------------------

const IconGripDots = () => (
    <svg viewBox="0 0 320 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zm192-128l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1 0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40z"
        />
    </svg>
);

const IconFolderPlus = () => (
    <svg className="codebookButtonIcon" width="16" height="16" viewBox="64 48 512 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M576 448C576 483.3 547.3 512 512 512L128 512C92.7 512 64 483.3 64 448L64 160C64 124.7 92.7 96 128 96L266.7 96C280.5 96 294 100.5 305.1 108.8L343.5 137.6C349 141.8 355.8 144 362.7 144L512 144C547.3 144 576 172.7 576 208L576 448zM320 224C306.7 224 296 234.7 296 248L296 296L248 296C234.7 296 224 306.7 224 320C224 333.3 234.7 344 248 344L296 344L296 392C296 405.3 306.7 416 320 416C333.3 416 344 405.3 344 392L344 344L392 344C405.3 344 416 333.3 416 320C416 306.7 405.3 296 392 296L344 296L344 248C344 234.7 333.3 224 320 224z"
        />
    </svg>
);

const IconSquarePlus = () => (
    <svg className="codebookButtonIcon" width="16" height="16" viewBox="64 64 512 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M160 144C151.2 144 144 151.2 144 160L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 160C496 151.2 488.8 144 480 144L160 144zM96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"
        />
    </svg>
);

const IconTrash = () => (
    <svg className="codebookButtonIcon" width="16" height="16" viewBox="0 0 448 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M144 0L128 32 0 32 0 96l448 0 0-64L320 32 304 0 144 0zM416 128L32 128 56 512l336 0 24-384z" />
    </svg>
);

const IconUndo = () => (
    <svg className="codebookButtonIcon" viewBox="0 0 512 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M125.7 160l50.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L48 224c-17.7 0-32-14.3-32-32L16 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"
        />
    </svg>
);

const IconRedo = () => (
    <svg className="codebookButtonIcon" viewBox="0 0 512 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"
        />
    </svg>
);

const IconCopy = () => (
    <svg className="codebookButtonIcon" viewBox="0 0 448 512" role="img" xmlns="http://www.w3.org/2000/svg">
        <path
            fill="currentColor"
            d="M400 336l-224 0 0-288 156.1 0L400 115.9 400 336zM448 96L352 0 176 0 128 0l0 48 0 288 0 48 48 0 224 0 48 0 0-48 0-240zM48 128L0 128l0 48L0 464l0 48 48 0 224 0 48 0 0-48 0-48-48 0 0 48L48 464l0-288 48 0 0-48-48 0z"
        />
    </svg>
);

// Dados do codebook (portados de CodebookEditor.tsx) ---------------------------

type CodebookRow =
    | { kind: 'net'; label: string }
    | { kind: 'code'; label: string; rule: string };

const CODEBOOK_ROWS: CodebookRow[] = [
    { kind: 'net', label: 'Amazon Shopping And Delivery Services' },
    { kind: 'code', label: 'Amazon', rule: 'Apply this code when a respondent mentions Amazon, Amazon.com, or AMAZOn as a shopping destination, excluding Amazon Fresh and Amazon Prime.' },
    { kind: 'code', label: 'Amazon Fresh', rule: 'Apply this code when a respondent mentions Amazon Fresh, Amazon fresh, AMAZON FRESH, or amazon fresh as a shopping destination.' },
    { kind: 'code', label: 'Amazon Prime', rule: 'Apply this code when a respondent mentions Amazon Prime or Amazon prime as a shopping or delivery service.' },
    { kind: 'code', label: 'Walmart+', rule: 'Apply this code when a respondent mentions Walmart+, walmart+, or Walmart InHome as a service.' },

    { kind: 'net', label: 'Discount And Dollar Stores' },
    { kind: 'code', label: 'Save-A-Lot', rule: 'Apply this code when a respondent mentions Save a Lot or Save-A-Lot as a shopping destination.' },
    { kind: 'code', label: 'Dollar Tree', rule: 'Apply this code when a respondent mentions Dollar Tree or dollar tree as a shopping destination.' },
    { kind: 'code', label: 'Dollar General', rule: 'Apply this code when a respondent mentions Dollar general or Dollar General as a shopping destination.' },
    { kind: 'code', label: '7-Eleven', rule: 'Apply this code when a respondent mentions 7 eleven as a shopping destination.' },

    { kind: 'net', label: 'Food And Restaurant Delivery Services' },
    { kind: 'code', label: 'Uber Eats', rule: 'Apply this code when a respondent mentions Uber Eats, Ubereats, ubereats, Ubereat, UberEats, UberEATS, or Ubeeat as a delivery service.' },
    { kind: 'code', label: 'DoorDash', rule: 'Apply this code when a respondent mentions DoorDash, Doordash, Door Dash, Door bash, dash door, or dordash as a delivery service.' },
    { kind: 'code', label: 'GrubHub', rule: 'Apply this code when a respondent mentions GrubHub, grubhub, Grubhut, or Greetings as a delivery service.' },
    { kind: 'code', label: 'Uber', rule: 'Apply this code when a respondent mentions Uber or uber as a delivery service, excluding Uber Eats.' },

    { kind: 'net', label: 'General Online Marketplaces' },
    { kind: 'code', label: 'Military Commissary', rule: 'Apply this code when a respondent mentions Military commissary as a shopping destination.' },
    { kind: 'code', label: 'eBay', rule: 'Apply this code when a respondent mentions Ebay or eBay as a shopping destination.' },
    { kind: 'code', label: 'Etsy', rule: 'Apply this code when a respondent mentions ETSY or Etsy as a shopping destination.' },

    { kind: 'net', label: 'Major National Grocery Retailers' },
    { kind: 'code', label: 'Walmart', rule: 'Apply this code when a respondent mentions Walmart, Walmart.com, Walmaret, Wallmart, or Wolmart as a grocery or retail shopping destination.' },
    { kind: 'code', label: 'Target', rule: 'Apply this code when a respondent mentions Target or Target.com as a shopping destination.' },
    { kind: 'code', label: 'Kroger', rule: 'Apply this code when a respondent mentions Kroger as a shopping destination.' },
    { kind: 'code', label: 'Aldi', rule: 'Apply this code when a respondent mentions Aldi, Aldis, or Aldo as a shopping destination.' },
    { kind: 'code', label: 'Publix', rule: 'Apply this code when a respondent mentions Publix as a shopping destination.' },
    { kind: 'code', label: 'Wegmans', rule: 'Apply this code when a respondent mentions Wegmans or wegmans as a shopping destination.' },
    { kind: 'code', label: 'Safeway', rule: 'Apply this code when a respondent mentions Safeway or safeway as a shopping destination.' },

    { kind: 'net', label: 'No Preference Or Unable To Specify' },
    { kind: 'code', label: 'No preference', rule: 'Apply this code when a respondent explicitly states they have no preference or cannot choose between options.' },
    { kind: 'code', label: 'Cannot recall or specify', rule: 'Apply this code when a respondent indicates they cannot remember, are unsure, or cannot say anything about their shopping preferences.' },
    { kind: 'code', label: 'Non-response or unclear', rule: 'Apply this code when a respondent provides no meaningful answer, writes random characters, or provides gibberish that cannot be interpreted.' },

    { kind: 'net', label: 'Online Grocery Delivery Services' },
    { kind: 'code', label: 'Instacart', rule: 'Apply this code when a respondent mentions Instacart, intsacart, instarcart, Instrcart, Instacard, or INSTACART as a delivery service.' },
    { kind: 'code', label: 'Peapod', rule: 'Apply this code when a respondent mentions Peapod, peapod, Peapod, peapod.com, pea pod, Pepod, or Giant peapod as a shopping destination.' },
    { kind: 'code', label: 'FreshDirect', rule: 'Apply this code when a respondent mentions FreshDirect, Fresh Direct, fresh direct, Freshdirect, or freash direct as a shopping destination.' },
    { kind: 'code', label: 'Shipt', rule: 'Apply this code when a respondent mentions Shipt or shipt as a delivery service.' },

    { kind: 'net', label: 'Pharmacy And Convenience Stores' },
    { kind: 'code', label: 'Rite Aid', rule: 'Apply this code when a respondent mentions Rite Aid or rite aid as a shopping destination.' },
    { kind: 'code', label: 'The Natural', rule: 'Apply this code when a respondent mentions THE NATURAL as a shopping destination.' },

    { kind: 'net', label: 'Rapid Delivery Services' },
    { kind: 'code', label: 'GoPuff', rule: 'Apply this code when a respondent mentions GoPuff, Go Puff, Gopuff, or JOKR as a delivery service.' },
    { kind: 'code', label: 'Getir', rule: 'Apply this code when a respondent mentions Getir as a delivery service.' },
    { kind: 'code', label: 'Gorillas', rule: 'Apply this code when a respondent mentions Gorillas or Gorilla as a delivery service.' },

    { kind: 'net', label: 'Regional And Local Grocery Stores' },
    { kind: 'code', label: 'Shoprite', rule: 'Apply this code when a respondent mentions Shoprite, Shop Rite, ShopRite, Shopriye, Shop-rite, or Shoprite from home as a shopping destination.' },
    { kind: 'code', label: 'Stop & Shop', rule: 'Apply this code when a respondent mentions Stop & Shop, Stop and Shop, Stop n shop, Stop N Shop, Stop&Shop, Stop&shop, Stop @Shop, or Stop shop as a shopping destination.' },
    { kind: 'code', label: 'Giant', rule: 'Apply this code when a respondent mentions Giant, Giant Food, Giant Foods, or Giant peapod as a shopping destination.' },
    { kind: 'code', label: 'Acme', rule: 'Apply this code when a respondent mentions Acme, acme, ACME, or Acame as a shopping destination.' },
    { kind: 'code', label: 'Food Bazaar', rule: 'Apply this code when a respondent mentions Food Bazaar or FOOD BAZAAR as a shopping destination.' },
    { kind: 'code', label: 'Pathmark', rule: 'Apply this code when a respondent mentions Pathmark as a shopping destination.' },
    { kind: 'code', label: 'Key Food', rule: 'Apply this code when a respondent mentions Key Food, Key food, Keyfood, or key as a shopping destination.' },
    { kind: 'code', label: 'Foodtown', rule: 'Apply this code when a respondent mentions Foodtown, Food town, or food town as a shopping destination.' },
    { kind: 'code', label: 'Redners', rule: 'Apply this code when a respondent mentions Redners as a shopping destination.' },
    { kind: 'code', label: 'Kings', rule: 'Apply this code when a respondent mentions Kings as a shopping destination.' },
    { kind: 'code', label: 'Gristedes', rule: 'Apply this code when a respondent mentions Gristedes as a shopping destination.' },
    { kind: 'code', label: 'C-Town', rule: 'Apply this code when a respondent mentions C town or C-Town as a shopping destination.' },
    { kind: 'code', label: 'Food Emporium', rule: 'Apply this code when a respondent mentions Food Emporium as a shopping destination.' },
    { kind: 'code', label: 'Bravo', rule: 'Apply this code when a respondent mentions Bravo as a shopping destination.' },
    { kind: 'code', label: 'Deluxe Food Market', rule: 'Apply this code when a respondent mentions Deluxe food market as a shopping destination.' },
    { kind: 'code', label: "Wellstone's", rule: "Apply this code when a respondent mentions wellstone's as a shopping destination." },
    { kind: 'code', label: "Uncle Giuseppe's", rule: 'Apply this code when a respondent mentions uncle giuseppes as a shopping destination.' },
    { kind: 'code', label: 'Flatbush Food Co-op', rule: 'Apply this code when a respondent mentions Flatbush Food Co-op as a shopping destination.' },
    { kind: 'code', label: 'Supremo Supermarket', rule: 'Apply this code when a respondent mentions Supremo supermarket as a shopping destination.' },
    { kind: 'code', label: "Anny's", rule: "Apply this code when a respondent mentions Anny's as a shopping destination." },

    { kind: 'net', label: 'Specialty And Natural Food Stores' },
    { kind: 'code', label: 'Whole Foods', rule: 'Apply this code when a respondent mentions Whole Foods, Whole Food, Whole foods market, or Whole Foods on Amazon.' },
    { kind: 'code', label: "Trader Joe's", rule: "Apply this code when a respondent mentions Trader Joe's, Trader Joes, traders joes, or trader joe's as a shopping destination." },
    { kind: 'code', label: 'Sprouts', rule: 'Apply this code when a respondent mentions Sprouts as a shopping destination.' },
    { kind: 'code', label: 'H-Mart', rule: 'Apply this code when a respondent mentions H-Mart as a shopping destination.' },

    { kind: 'net', label: 'Warehouse And Bulk Retailers' },
    { kind: 'code', label: 'Costco', rule: 'Apply this code when a respondent mentions Costco or Cosco as a shopping destination.' },
    { kind: 'code', label: "Sam's Club", rule: "Apply this code when a respondent mentions Sam's Club, Sam's club, Sams club, or Sam's as a shopping destination." },
    { kind: 'code', label: "BJ's", rule: "Apply this code when a respondent mentions BJ's, bj's, BJ, or BJS as a shopping destination." },
    { kind: 'code', label: 'Boxed.com', rule: 'Apply this code when a respondent mentions Boxed.com as a shopping destination.' },

    { kind: 'net', label: 'Other Codes' },
    { kind: 'code', label: 'Lidl', rule: 'Apply this code when a respondent mentions Lidl, Lidls, or Lidi as a shopping destination.' },
    { kind: 'code', label: 'Netflix', rule: 'Apply this code when a respondent mentions netflix as a service.' },
    { kind: 'code', label: 'Positive sentiment - excellent or very good', rule: 'Apply this code when a respondent expresses strong positive sentiment using words like excellent, very good, great, awesome, or perfect about a store or service.' },
    { kind: 'code', label: 'Positive sentiment - good or like', rule: 'Apply this code when a respondent expresses moderate positive sentiment using words like good, like, nice, or cool about a store or service.' },
    { kind: 'code', label: 'Okay or acceptable', rule: 'Apply this code when a respondent expresses neutral or lukewarm sentiment using words like okay, alright, or acceptable about a store or service.' },
];

// Histórico de edições (undo/redo) -------------------------------------------
// past  = snapshots anteriores (topo = mais recente);
// present = estado atual do codebook;
// future = snapshots desfeitos, prontos para refazer.
interface HistoryState {
    past: CodebookRow[][];
    present: CodebookRow[];
    future: CodebookRow[][];
}

type HistoryAction =
    | { type: 'commit'; rows: CodebookRow[] }
    | { type: 'undo' }
    | { type: 'redo' };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
    switch (action.type) {
        case 'commit':
            // Nova edição: empurra o present para past e limpa o future
            // (a linha do tempo "refazer" deixa de valer após uma nova mudança).
            return {
                past: [...state.past, state.present],
                present: action.rows,
                future: [],
            };
        case 'undo': {
            if (state.past.length === 0) return state;
            const previous = state.past[state.past.length - 1];
            return {
                past: state.past.slice(0, -1),
                present: previous,
                future: [state.present, ...state.future],
            };
        }
        case 'redo': {
            if (state.future.length === 0) return state;
            const next = state.future[0];
            return {
                past: [...state.past, state.present],
                present: next,
                future: state.future.slice(1),
            };
        }
        default:
            return state;
    }
}

function ValidatorCodesModal({ onClose }: ValidatorCodesModalProps) {
    // Controla a exibição das descrições (code rules). Ligado ao checkbox
    // "Code rules" do header: marcado mostra a 2ª linha de cada code,
    // desmarcado deixa só o label.
    const [showRules, setShowRules] = useState(true);

    // Codes selecionados por clique. O estado visual (mesmo do hover) persiste
    // até o usuário clicar em outro item ou clicar fora da lista. Segurando
    // Ctrl/⌘ o clique alterna o item, permitindo selecionar vários ao mesmo
    // tempo; um clique normal seleciona só aquele.
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    // Delete do header só fica habilitado quando há pelo menos um code selecionado.
    const hasSelection = selectedIndices.size > 0;

    const selectCode = (index: number, additive: boolean) => {
        setSelectedIndices((prev) => {
            if (additive) {
                const next = new Set(prev);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
            }
            return new Set([index]);
        });
    };

    // Edição por duplo-clique (padrão Trello/planilhas): os textos ficam
    // só-leitura até o usuário dar dois cliques no campo. `editing` guarda qual
    // campo (linha + tipo) está editável no momento.
    const [editing, setEditing] = useState<
        { index: number; field: 'label' | 'rule' } | null
    >(null);

    const isEditing = (index: number, field: 'label' | 'rule') =>
        editing?.index === index && editing.field === field;

    // Ao entrar em edição, foca o campo e posiciona o cursor no fim do texto.
    const editRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (!editing) return;
        const el = editRef.current;
        if (!el) return;
        el.focus();
        const selection = window.getSelection();
        if (selection) {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, [editing]);

    // Enter/Esc confirmam o valor tirando o foco (o commit acontece no blur).
    const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    // Codebook + histórico de undo/redo.
    const [history, dispatch] = useReducer(historyReducer, {
        past: [],
        present: CODEBOOK_ROWS,
        future: [],
    });
    const rows = history.present;
    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    // Comita uma edição de campo (chamado no blur do contentEditable). Só gera
    // entrada de histórico se o texto realmente mudou.
    const commitEdit = (index: number, field: 'label' | 'rule', value: string) => {
        const current = rows[index];
        if (!current) return;
        const currentValue =
            field === 'rule' && current.kind === 'code' ? current.rule : current.label;
        if (value === currentValue) return;

        const nextRows = rows.map((row, i) => {
            if (i !== index) return row;
            if (field === 'rule' && row.kind === 'code') return { ...row, rule: value };
            return { ...row, label: value };
        });
        dispatch({ type: 'commit', rows: nextRows });
    };

    // Drag-and-drop para MERGE de codes. Só codes têm handle arrastável (nets
    // não). Arrastar um code e soltar sobre outro funde os dois: o label do
    // alvo passa a ser "labelArrastado, labelAlvo", a rule do alvo é mantida e o
    // code arrastado é removido. O drag opera só no code agarrado — ignora a
    // multi-seleção (Ctrl/⌘). `draggingIndex` é a origem; `mergeTargetIndex` é o
    // alvo sob o cursor, usado só para o realce visual.
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [mergeTargetIndex, setMergeTargetIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => (e: React.DragEvent<HTMLElement>) => {
        setDraggingIndex(index);
        // Necessário para o Firefox de fato iniciar o drag.
        e.dataTransfer.setData('text/plain', String(index));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggingIndex(null);
        setMergeTargetIndex(null);
    };

    // Só permite soltar sobre outro code (não sobre a origem nem sobre um net).
    const isValidMergeTarget = (index: number) =>
        draggingIndex !== null && index !== draggingIndex && rows[index]?.kind === 'code';

    const handleDragOver = (index: number) => (e: React.DragEvent<HTMLElement>) => {
        if (!isValidMergeTarget(index)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (mergeTargetIndex !== index) setMergeTargetIndex(index);
    };

    const handleDrop = (index: number) => (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        const sourceIndex = draggingIndex;
        setDraggingIndex(null);
        setMergeTargetIndex(null);
        if (sourceIndex === null || !isValidMergeTarget(index)) return;

        const source = rows[sourceIndex];
        const target = rows[index];
        if (source?.kind !== 'code' || target?.kind !== 'code') return;

        // Alvo sobrevive com o label combinado; a rule do alvo é mantida.
        const mergedLabel = `${source.label}, ${target.label}`;
        const nextRows = rows
            .map((row, i) => (i === index ? { ...row, label: mergedLabel } : row))
            .filter((_, i) => i !== sourceIndex);

        // Índices mudam após a remoção; limpa seleção e edição para não apontar
        // para linhas erradas.
        setSelectedIndices(new Set());
        setEditing(null);
        dispatch({ type: 'commit', rows: nextRows });
    };

    return (
        <div className="validator-overlay" role="dialog" aria-modal="true">
            <div className="modal-dialog">
                <div className="modal-content">
                    {/* Header */}
                    <div className="modal-header dialogHeader">
                        <h4 className="modal-title">67 Codes</h4>
                        <div className="aiCoder-dialog-prompt-multiline-codebook-tools">
                            <input
                                id="aiCoder-dialog-prompt-multiline-search"
                                type="search"
                                placeholder="Search..."
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <div className="codebookToolbarActionGroup">
                                <button type="button" className="codebookToolbarButton" title="New Net">
                                    <IconFolderPlus />
                                    <span className="codebookToolbarButtonLabel">New Net</span>
                                </button>
                                <button type="button" className="codebookToolbarButton disabled" disabled title="New Code">
                                    <IconSquarePlus />
                                    <span className="codebookToolbarButtonLabel">New Code</span>
                                </button>
                            </div>
                            <button
                                type="button"
                                className={`codebookToolbarButton aiCoderHeaderButtonIconOnly${hasSelection ? '' : ' disabled'}`}
                                disabled={!hasSelection}
                                title="Delete codes"
                            >
                                <IconTrash />
                            </button>
                            <div className="aiCoder-dialog-prompt-multiline-show-rules-group">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="aiCoder-dialog-prompt-multiline-show-rules"
                                    checked={showRules}
                                    onChange={(e) => setShowRules(e.target.checked)}
                                />
                                <label id="aiCoder-dialog-prompt-multiline-show-rules-label" htmlFor="aiCoder-dialog-prompt-multiline-show-rules">
                                    View code rules
                                </label>
                            </div>
                        </div>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
                    </div>

                    {/* Body */}
                    <div className="modal-body">
                        {/* Subtítulo: orienta o usuário sobre a tela e sinaliza que os
                            textos (label/rule) são editáveis clicando neles. Fica dentro
                            da área de scroll, rolando junto com a lista. */}
                        <p className="codebookModalSubtitle">
                            Review and refine your codebook. Click any code or rule to edit.
                        </p>
                        <div className="form-group">
                            {/* Container não editável; os textos internos (net,
                                label e rule) são contentEditable — igual ao
                                export original, o usuário edita clicando neles. */}
                            <div
                                id="aiCoder-dialog-prompt-multiline-html"
                                contentEditable={false}
                                onClick={() => setSelectedIndices(new Set())}
                            >
                                {rows.map((row, index) =>
                                    row.kind === 'net' ? (
                                        <div key={index} className="codebook-net">
                                            <span
                                                className="codebook-net-label"
                                                contentEditable={isEditing(index, 'label')}
                                                suppressContentEditableWarning
                                                ref={isEditing(index, 'label') ? editRef : undefined}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditing({ index, field: 'label' });
                                                }}
                                                onBlur={(e) => {
                                                    commitEdit(index, 'label', e.currentTarget.textContent ?? '');
                                                    setEditing(null);
                                                }}
                                                onKeyDown={handleFieldKeyDown}
                                            >
                                                {row.label}
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            key={index}
                                            className={`codebook-code${selectedIndices.has(index) ? ' selected' : ''}${draggingIndex === index ? ' dragging' : ''}${mergeTargetIndex === index ? ' merge-target' : ''}`}
                                            contentEditable={false}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selectCode(index, e.ctrlKey || e.metaKey);
                                            }}
                                            onDragOver={handleDragOver(index)}
                                            onDrop={handleDrop(index)}
                                        >
                                            <span
                                                className="codebook-code-drag-handle"
                                                contentEditable={false}
                                                draggable
                                                title="Drag to move or merge"
                                                onDragStart={handleDragStart(index)}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <IconGripDots />
                                            </span>
                                            <div className="codebook-code-body">
                                                <span
                                                    className="codebook-code-label"
                                                    contentEditable={isEditing(index, 'label')}
                                                    suppressContentEditableWarning
                                                    ref={isEditing(index, 'label') ? editRef : undefined}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditing({ index, field: 'label' });
                                                    }}
                                                    onBlur={(e) => {
                                                        commitEdit(index, 'label', e.currentTarget.textContent ?? '');
                                                        setEditing(null);
                                                    }}
                                                    onKeyDown={handleFieldKeyDown}
                                                >
                                                    {row.label}
                                                </span>
                                                <span className="codebook-rule-separator" contentEditable={false}>
                                                    {' · '}
                                                </span>
                                                {showRules && (
                                                    <span
                                                        className="codebook-rule"
                                                        contentEditable={isEditing(index, 'rule')}
                                                        suppressContentEditableWarning
                                                        ref={isEditing(index, 'rule') ? editRef : undefined}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditing({ index, field: 'rule' });
                                                        }}
                                                        onBlur={(e) => {
                                                            commitEdit(index, 'rule', e.currentTarget.textContent ?? '');
                                                            setEditing(null);
                                                        }}
                                                        onKeyDown={handleFieldKeyDown}
                                                    >
                                                        {row.rule}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer aiCoder-dialog-prompt-multiline-footer">
                        <div className="aiCoder-dialog-prompt-multiline-codebook-footer-tools">
                            <button
                                type="button"
                                className={`codebookToolbarButton aiCoderHeaderButtonIconOnly${canUndo ? '' : ' disabled'}`}
                                disabled={!canUndo}
                                title="Undo"
                                onClick={() => dispatch({ type: 'undo' })}
                            >
                                <IconUndo />
                            </button>
                            <button
                                type="button"
                                className={`codebookToolbarButton aiCoderHeaderButtonIconOnly${canRedo ? '' : ' disabled'}`}
                                disabled={!canRedo}
                                title="Redo"
                                onClick={() => dispatch({ type: 'redo' })}
                            >
                                <IconRedo />
                            </button>
                            <button type="button" className="codebookToolbarButton aiCoderHeaderButtonIconOnly" title="Copy">
                                <IconCopy />
                            </button>
                        </div>
                        <div className="aiCoder-dialog-prompt-multiline-footer-actions">
                            <button type="button" className="btn aiCoderSecondaryActionButton" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="button" className="btn aiCoderPrimaryActionButton">
                                Apply Codebook
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ValidatorCodesModal;
