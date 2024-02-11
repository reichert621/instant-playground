import {NextPage} from 'next';
import Link from 'next/link';
import React, {FormEvent} from 'react';
import {useDebounce} from 'react-use';
import {getLocalId, id, transact, tx, useQuery} from '@instantdb/react';

import {cn, times} from '@/lib/utils';
import Debugger from '@/components/Debugger';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import Markdown from '@/components/Markdown';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from '@radix-ui/react-icons';
// import Editor from '@/components/EditorV1';
import {Editor} from '@/components/editor/Editor';

function getCurrentDate() {
  const [date, time] = new Date().toISOString().split('T');

  return date;
}

function ChatExample({className}: {className: string}) {
  const conversationId = getCurrentDate();
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');
  const {data, isLoading, error} = useQuery({
    messages: {
      $: {where: {conversationId}},
      users: {},
    },
  });
  const messages = data?.messages || [];

  React.useEffect(() => {
    const init = async () => {
      try {
        setUserId(await getLocalId('user'));
      } catch (err) {
        //
      }
    };

    init();
  }, []);

  React.useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollIntoView({block: 'nearest', inline: 'start'});
    }
  }, [messages.length, scrollRef.current]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    transact(
      tx.messages[id()].update({
        userId,
        conversationId,
        content: message,
        timestamp: +new Date(),
      })
    );

    setMessage('');
  };

  const handleDeleteMessage = (id: string) => {
    transact(tx.messages[id].delete());
  };

  return (
    <div className={className}>
      <div className="">
        <div className="border-b bg-zinc-50 px-4 pb-3 pt-4">
          <h3 className="text-lg font-bold">Public chat room</h3>
          <p className="font- text-sm text-zinc-600">Come say hi!</p>
        </div>
        <div className="flex h-96 flex-col gap-1 overflow-auto p-4">
          {messages
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => {
              const isMe = message.userId === userId;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-center duration-500 animate-in fade-in-0',
                    isMe ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-md px-3 py-2',
                      isMe
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-200 text-zinc-800'
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    {/* 
                    <Button onClick={() => handleDeleteMessage(message.id)}>
                      Delete
                    </Button> 
                    */}
                  </div>
                </div>
              );
            })}
          <div ref={scrollRef} />
        </div>
        <form
          className="flex items-center gap-1 px-4 pb-4 pt-2"
          onSubmit={handleSendMessage}
        >
          <Input
            className="bg-white"
            placeholder="Type a message..."
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
      {/* <Debugger data={data} /> */}
    </div>
  );
}

function MarkdownEditorExample({className}: {className: string}) {
  const date = getCurrentDate();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [content, setLocalContent] = React.useState<string>('');
  const [isReady, setReadyState] = React.useState(false);

  const [, cancel] = useDebounce(
    () => {
      if (isReady) {
        save(content);
      }
    },
    1000,
    [content]
  );
  const {data, isLoading, error} = useQuery({
    docs: {
      $: {where: {date}},
    },
  });
  const [doc] = data?.docs || [];

  React.useEffect(() => {
    const init = async () => {
      try {
        setUserId(await getLocalId('user'));
      } catch (err) {
        //
      }
    };

    init();
  }, []);

  React.useEffect(() => {
    const run = async () => {
      if (isLoading) {
        return;
      } else if (error) {
        return console.error('Failed to fetch docs!', error);
      }

      const [doc] = data.docs;

      if (!doc) {
        const payload = {
          content: '# Hello world!',
          date: date,
          createdAt: +new Date(),
          updatedAt: +new Date(),
        };

        transact(tx.docs[id()].update(payload));
      } else {
        // TODO: how to effectively merge content?
        setLocalContent(doc.content);
        setReadyState(true);
      }
    };

    run();
  }, [isLoading, error, data, isReady]);

  const seed = () => {
    if (doc) {
      transact(tx.docs[doc.id].delete());
    } else {
      const payload = {
        content: 'Hello world',
        date: date,
        createdAt: +new Date(),
        updatedAt: +new Date(),
      };

      transact(tx.docs[id()].update(payload));
    }
  };

  const save = (content: string) => {
    if (!doc) {
      return;
    }

    transact(
      tx.docs[doc.id].update({
        content,
        updatedAt: +new Date(),
        lastUpdatedBy: userId,
      })
    );
  };

  return (
    <div className={className}>
      {/* TODO: try with https://github.com/facebook/lexical */}
      {/* <Textarea
            className="h-full w-full flex-1"
            rows={8}
            disabled={!isReady}
            value={content}
            onChange={(e) => setLocalContent(e.target.value)}
          /> */}

      <Editor />
    </div>
  );
}

const GRID = 50;
const MIDPOINT = 25;

const getCurrentPosition = (drawing: any) => {
  if (!drawing) {
    return [MIDPOINT, MIDPOINT];
  }

  const {current = []} = drawing;
  const [x = MIDPOINT, y = MIDPOINT] = current;

  return [x, y];
};

function SketchExample({className}: {className: string}) {
  const date = getCurrentDate();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isDrawing, setDrawingState] = React.useState(true);

  const {data, isLoading, error} = useQuery({
    drawings: {
      $: {where: {date}},
      pixels: {},
    },
  });
  const [drawing] = data?.drawings || [];
  const pixels = drawing?.pixels || [];
  const position = getCurrentPosition(drawing);

  const pixelsByKey = pixels.reduce(
    (acc, pixel) => {
      const key = [pixel.x, pixel.y].join('x');

      return {...acc, [key]: pixel};
    },
    {} as Record<string, any>
  );

  React.useEffect(() => {
    const init = async () => {
      try {
        setUserId(await getLocalId('user'));
      } catch (err) {
        //
      }
    };

    init();
  }, []);

  React.useEffect(() => {
    const run = async () => {
      if (isLoading) {
        return;
      } else if (error) {
        return console.error('Failed to fetch docs!', error);
      }

      const [drawing] = data.drawings;

      if (!drawing) {
        const drawingId = id();
        const pixelId = id();

        const txns = [
          tx.drawings[drawingId].update({
            date: date,
            createdAt: +new Date(),
            updatedAt: +new Date(),
            current: [MIDPOINT, MIDPOINT],
          }),
          tx.pixels[pixelId].update({
            x: MIDPOINT,
            y: MIDPOINT,
            userId,
            drawingId: drawingId,
            timestamp: +new Date(),
          }),
          tx.drawings[drawingId].link({pixels: pixelId}),
        ];

        transact(txns);
      }
    };

    run();
  }, [isLoading, error, data]);

  const draw = (x: number, y: number) => {
    if (!drawing) {
      return;
    }

    const pixelId = id();

    const txns = [
      tx.pixels[pixelId].update({
        x,
        y,
        userId,
        drawingId: drawing.id,
        timestamp: +new Date(),
      }),
      tx.drawings[drawing.id].link({pixels: pixelId}),
      // tx.drawings[drawing.id].update({current: [x, y]}),
    ];

    transact(txns);
  };

  const erase = (x: number, y: number) => {
    if (!drawing) {
      return;
    }

    const found = pixels.filter((p) => p.x === x && p.y === y);
    const txns = found.map((pixel) => tx.pixels[pixel.id].delete());

    transact([
      ...txns,
      // tx.drawings[drawing.id].update({current: [x, y]})
    ]);
  };

  const updateCurrentPosition = (x: number, y: number) => {
    if (!drawing) {
      return;
    }

    transact([tx.drawings[drawing.id].update({current: [x, y]})]);
  };

  const move = (
    direction: 'up' | 'down' | 'left' | 'right',
    event?: KeyboardEvent
  ) => {
    event?.preventDefault();
    const [x, y] = position;

    if (isDrawing) {
      draw(x, y);
    } else {
      erase(x, y);
    }

    switch (direction) {
      case 'up':
        return updateCurrentPosition(x, y - 1);
      case 'down':
        return updateCurrentPosition(x, y + 1);
      case 'left':
        return updateCurrentPosition(x - 1, y);
      case 'right':
        return updateCurrentPosition(x + 1, y);
    }
  };

  // // Add key bindings
  // React.useEffect(() => {
  //   const cb = (e: KeyboardEvent) => {
  //     switch (e.key) {
  //       case 'ArrowUp':
  //         return move('up', e);
  //       case 'ArrowDown':
  //         return move('down', e);
  //       case 'ArrowLeft':
  //         return move('left', e);
  //       case 'ArrowRight':
  //         return move('right', e);
  //     }
  //   };

  //   document.addEventListener('keydown', cb);

  //   return () => document.removeEventListener('keydown', cb);
  // }, [position]);

  const reset = (force = false) => {
    if (force) {
      return transact([tx.drawings[drawing.id].delete()]);
    }

    const txns = pixels.map((p) => {
      return tx.pixels[p.id].delete();
    });

    transact([
      ...txns,
      tx.drawings[drawing.id].update({current: [MIDPOINT, MIDPOINT]}),
    ]);
    draw(MIDPOINT, MIDPOINT);
  };

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center rounded border">
        <div
          style={{
            gridTemplateColumns: `repeat(${GRID}, 8px)`,
            gridTemplateRows: `repeat(${GRID}, 8px)`,
          }}
          className="grid gap-0 overflow-hidden"
        >
          {times(GRID).map((i) => {
            return (
              <div key={i}>
                {times(GRID).map((j) => {
                  const current = drawing?.current || [];
                  const key = [i, j].join('x');
                  const isMarked = !!pixelsByKey[key];
                  const isCurrent = i === current[0] && j === current[1];

                  return (
                    <div
                      key={key}
                      className={cn(
                        'aspect-square h-2 w-2',
                        isMarked ? 'bg-zinc-900' : 'bg-zinc-100',
                        isCurrent && 'animate-pulse bg-blue-500'
                      )}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-2">
          <Button variant="secondary" size="icon" onClick={() => move('up')}>
            <ArrowUpIcon />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => move('down')}>
            <ArrowDownIcon />
          </Button>
          {/* <Button onClick={() => reset()}>Reset</Button> */}
          <div className="flex items-center">
            <Button
              className="rounded-l-md rounded-r-none"
              variant={isDrawing ? 'default' : 'outline'}
              onClick={() => setDrawingState(true)}
            >
              Drawing
            </Button>
            <Button
              className="rounded-l-none rounded-r-md"
              variant={isDrawing ? 'outline' : 'default'}
              onClick={() => setDrawingState(false)}
            >
              Erasing
            </Button>
          </div>
          <Button variant="secondary" size="icon" onClick={() => move('left')}>
            <ArrowLeftIcon />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => move('right')}>
            <ArrowRightIcon />
          </Button>
        </div>
      </div>

      {/* <Debugger data={data} /> */}
    </div>
  );
}

const IndexPage: NextPage = () => {
  return (
    <div
      className={cn(
        'flex min-h-screen w-full flex-1 flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100'
      )}
    >
      <main className="mx-auto w-full max-w-7xl flex-1 bg-white px-8 py-12 dark:bg-zinc-900">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
          Playground
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
          Examples of Instant in action!
        </p>

        <ChatExample className="my-8 w-full max-w-md rounded border" />
        <MarkdownEditorExample className="my-8 w-full max-w-4xl" />
        <SketchExample className="my-8 w-full max-w-4xl" />
      </main>
    </div>
  );
};

export default IndexPage;
