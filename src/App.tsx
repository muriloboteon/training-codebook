import { useState } from 'react';
import PrototypeNav, { type PrototypeView } from './components/PrototypeNav';
import AccountCodebooksPage from './components/AccountCodebooksPage';
import ValidatorPage from './components/ValidatorPage';

function App() {
  const [view, setView] = useState<PrototypeView>('account-codebooks');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <PrototypeNav activeView={view} onChange={setView} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {view === 'account-codebooks' ? <AccountCodebooksPage /> : <ValidatorPage />}
      </div>
    </div>
  );
}

export default App;
