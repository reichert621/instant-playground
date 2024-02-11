import {NextPage} from 'next';
import Link from 'next/link';
import React from 'react';
import Head from 'next/head';
import {useRouter} from 'next/router';
import {auth} from '@instantdb/react';
import {ArrowRightIcon} from '@radix-ui/react-icons';

import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {useToast} from '@/components/ui/use-toast';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [email, setUserEmail] = React.useState('');
  const [hasSentCode, setHasSentCode] = React.useState(false);
  const [code, setMagicCode] = React.useState('');
  const [isPending, setPendingState] = React.useState(false);
  const [error, setErrorMessage] = React.useState<string | null>(null);

  const handleSendMagicCode = async (e: any) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    try {
      setPendingState(true);
      const result = await auth.sendMagicCode({email});
      console.log('Success!', result);
      setHasSentCode(true);
    } catch (err: any) {
      console.error('Failed to send magic code:', err);
      alert('Something went wrong:' + err.body?.message);
    } finally {
      setPendingState(false);
    }
  };

  const handleVerifyMagicCode = async (e: any) => {
    e.preventDefault();

    if (!code) {
      return;
    }

    try {
      setPendingState(true);
      const result = await auth.signInWithMagicCode({email, code});
      console.log('Success!', result);
      return router.push('/');
    } catch (err: any) {
      console.error('Failed to verify magic code:', err);
      alert('Something went wrong:' + err.body?.message);
    } finally {
      setPendingState(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-center bg-white">
      <Head>
        <title>Log in</title>
      </Head>

      {hasSentCode ? (
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <h1 className="mb-1.5 mt-8 text-2xl font-bold text-zinc-900">
            Enter verification code
          </h1>
          <p className="text-zinc-500">
            A login code was sent to{' '}
            <span className="font-semibold text-zinc-700">{email}</span>
          </p>

          <form className="mb-8 mt-6" onSubmit={handleVerifyMagicCode}>
            <div className="mb-4">
              <Label htmlFor="code" className="select-none text-zinc-500">
                Verification code
              </Label>
              <Input
                id="code"
                className="mt-1"
                autoFocus
                placeholder="000000"
                required
                value={code}
                onChange={(e) => setMagicCode(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={isPending || !code}
            >
              {isPending ? 'Verifying...' : 'Verify code'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <h1 className="mb-1.5 mt-8 text-2xl font-bold text-zinc-900">
            Log in
          </h1>
          <p className="text-zinc-500">
            Enter your email to receive a login code.
          </p>

          <form className="mb-8 mt-6" onSubmit={handleSendMagicCode}>
            <div className="mb-4">
              <Label htmlFor="email" className="select-none text-zinc-500">
                Email
              </Label>
              <Input
                id="email"
                className="mt-1"
                type="email"
                autoFocus
                placeholder="jane.doe@example.com"
                required
                value={email}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={isPending || !email}
            >
              {isPending ? 'Sending...' : 'Send code'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </main>
      )}
    </div>
  );
};

export default LoginPage;
