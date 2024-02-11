import {useCallback, useEffect, useState} from 'react';
import {
  $createNodeSelection,
  $createRangeSelection,
  $getSelection,
  $setSelection,
} from 'lexical';
import {CodeNode} from '@lexical/code';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {TRANSFORMERS} from '@lexical/markdown';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {transact, tx, useQuery} from '@instantdb/react';
import {cn} from '@/lib/utils';

function useCurrentDoc() {
  const {data, isLoading, error} = useQuery({
    docs: {
      $: {where: {date: '2024-02-11'}},
    },
  });

  const [doc = null] = data?.docs || [];

  return {doc, isLoading, error};
}
export function InstantStoragePlugin() {
  const [editor] = useLexicalComposerContext();
  const {doc, isLoading, error} = useCurrentDoc();
  const [pendingNodeKey, setPendingNodeKey] = useState<string | null>(null);

  useEffect(() => {
    if (pendingNodeKey) {
      editor.update(() => {
        try {
          const state = editor.getEditorState();
          const node = state._nodeMap.get(pendingNodeKey);

          if (node) {
            node.selectEnd();
          }
        } catch (e) {
          console.error('Oh no!', e);
        } finally {
          setPendingNodeKey(null);
        }
      });
    }
  }, [pendingNodeKey]);

  useEffect(() => {
    if (!doc?.state) {
      return;
    }

    const state = editor.getEditorState();
    const update = editor.parseEditorState(doc.state);
    const isEqual = JSON.stringify(state.toJSON()) === doc.state;

    if (!isEqual) {
      editor.update(
        () => {
          try {
            editor.setEditorState(update);

            const selection = $getSelection();

            if (selection) {
              const currentIndexesByKey = Array.from(
                state._nodeMap.entries()
              ).reduce(
                (acc, item, index) => {
                  const [key, node] = item;

                  return {...acc, [key]: index};
                },
                {} as Record<string, any>
              );

              const updatedKeysByIndex = Array.from(
                update._nodeMap.entries()
              ).reduce(
                (acc, item, index) => {
                  const [key, node] = item;

                  return {...acc, [index]: key};
                },
                {} as Record<string, any>
              );

              const [node] = selection.getNodes();
              const prevIndex = currentIndexesByKey[node.getKey()];
              const updatedKey = updatedKeysByIndex[prevIndex];
              console.log('Found node key', node.getKey(), '->', updatedKey);

              if (update._nodeMap.has(updatedKey)) {
                setPendingNodeKey(updatedKey);
              }
            }
          } catch (e) {
            console.log('Error updating editor!', e);
          }
        },
        {tag: 'collaboration'}
      );
    }
  }, [doc?.state]);

  useEffect(() => {
    return editor.registerUpdateListener(
      ({editorState, dirtyElements, dirtyLeaves}) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }

        if (!doc) {
          return;
        }

        const serializedState = JSON.stringify(editorState.toJSON());
        // console.log(
        //   'serializedState',
        //   JSON.stringify(editorState.toJSON(), null, 2)
        // );

        transact(tx.docs[doc.id].update({state: serializedState}));
      }
    );
  }, [editor, doc]);

  return null;
}

export const EDITOR_NAMESPACE = 'lexical-editor';

const EDITOR_NODES = [
  AutoLinkNode,
  CodeNode,
  HeadingNode,
  LinkNode,
  ListNode,
  ListItemNode,
  QuoteNode,
];

type EditorProps = {
  className?: string;
};

const content = `{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "yo",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}`.trim();

export function Editor(props: EditorProps) {
  return (
    <div
      id="editor-wrapper"
      className={cn(
        props.className,
        'prose prose-zinc relative prose-headings:mb-4 prose-headings:mt-2 prose-p:my-0'
      )}
    >
      {/* <EditorHistoryStateContext> */}
      <LexicalEditor
        config={{
          namespace: EDITOR_NAMESPACE,
          nodes: EDITOR_NODES,
          // editorState: content,
          theme: {
            root: 'p-4 border-zinc-200 border rounded h-auto min-h-[200px] focus:outline-none',
            link: 'cursor-pointer',
            text: {
              bold: 'font-semibold',
              underline: 'underline decoration-wavy',
              italic: 'italic',
              strikethrough: 'line-through',
              underlineStrikethrough: 'underlined-line-through',
            },
          },
          onError: (error) => {
            console.log(error);
          },
        }}
      />
      {/* </EditorHistoryStateContext> */}
    </div>
  );
}

type LexicalEditorProps = {
  config: Parameters<typeof LexicalComposer>['0']['initialConfig'];
};

export function LexicalEditor(props: LexicalEditorProps) {
  // const {historyState} = useEditorHistoryState();

  return (
    <LexicalComposer initialConfig={props.config}>
      {/* Official Plugins */}
      <RichTextPlugin
        contentEditable={<ContentEditable spellCheck={false} />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin
      // externalHistoryState={historyState}
      />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <ListPlugin />
      <LinkPlugin
      // validateUrl={isValidUrl}
      />

      {/* Custom Plugins */}
      <InstantStoragePlugin />
      {/* <ActionsPlugin />
      <AutoLinkPlugin />
      <EditLinkPlugin />
      <FloatingMenuPlugin />
      <LocalStoragePlugin namespace={EDITOR_NAMESPACE} />
      <OpenLinkPlugin /> */}
    </LexicalComposer>
  );
}

const Placeholder = () => {
  return (
    <div className="absolute left-[1.125rem] top-[1.125rem] opacity-50">
      Start writing...
    </div>
  );
};
