import {NextPage} from 'next';
import React from 'react';
import {id, useQuery, tx, transact, useAuth} from '@instantdb/react';

import Debugger from '@/components/Debugger';

const DebuggerPage: NextPage = () => {
  const {isLoading: isLoadingUser, user, error: authError} = useAuth();
  const {isLoading, error, data} = useQuery({});

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-xl flex-1 bg-white px-6 py-12">
        <div className="">
          <Debugger data={{user, ...data}} />
        </div>
      </main>
    </div>
  );
};

export default DebuggerPage;
