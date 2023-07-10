import Body from '@components/app/Body';
import Header from '@components/app/Header';

import './index.css';

const App = () => {
  return (
    <div className="bg-slate-100 dark:bg-slate-900 flex flex-col h-full text-slate-900 dark:text-slate-100">
      <Header />
      <Body />
    </div>
  );
};

export default App;
