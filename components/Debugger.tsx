import {cn} from '@/lib/utils';

export default function Debugger({
  className,
  data,
}: {
  className?: string;
  data: any;
}) {
  return (
    <div
      className={cn('rounded-md bg-black p-4 text-sm text-white', className)}
    >
      <pre>
        <code className="font-mono">{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
}
