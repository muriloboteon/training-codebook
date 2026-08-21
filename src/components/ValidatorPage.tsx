import { color } from '../tokens';
import ValidatorCodesModal from './ValidatorCodesModal';

// -----------------------------------------------------------------------------
// ValidatorPage — conteúdo da aba "Validator" da PrototypeNav.
//
// Recurso SÓ de protótipo/validação (não faz parte do produto real). Exibe o
// "modal de codes" da tela AI Coder do Ascribe (ValidatorCodesModal) sobre um
// overlay escuro, para validarmos esse layout isoladamente.
//
// O overlay é posicionado dentro da área da aba (position: absolute), então não
// cobre a PrototypeNav no topo — dá pra continuar alternando entre as abas.
// -----------------------------------------------------------------------------

function ValidatorPage() {
    return (
        <div
            style={{
                position: 'relative',
                height: '100%',
                backgroundColor: color.surface,
            }}
        >
            <ValidatorCodesModal />
        </div>
    );
}

export default ValidatorPage;
